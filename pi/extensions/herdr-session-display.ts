import { resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const tokenFields = ["input", "output", "cacheRead", "cacheWrite"] as const;

export function aggregateBranchUsage(entries: readonly SessionEntry[]) {
	const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
	for (const entry of entries) {
		let usage: unknown;
		if (entry.type === "message") {
			if (entry.message.role === "assistant" || entry.message.role === "toolResult") {
				usage = entry.message.usage;
			}
		} else if (entry.type === "compaction" || entry.type === "branch_summary") {
			// retainedTail is context, not additional consumption.
			usage = entry.usage;
		}
		if (!usage || typeof usage !== "object") continue;
		for (const field of tokenFields) {
			const value = (usage as Record<string, unknown>)[field];
			if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
				totals[field] += value;
			}
		}
	}
	return totals;
}

function compactTokens(value: number): string {
	if (value < 1_000) return String(value);
	const [scale, suffix] = value >= 1_000_000_000 ? [1_000_000_000, "B"]
		: value >= 1_000_000 ? [1_000_000, "M"] : [1_000, "k"];
	return `${Number((value / scale).toFixed(2))}${suffix}`;
}

export function formatUsageRow(totals: ReturnType<typeof aggregateBranchUsage>, width: number, rate: number | null) {
	if (width <= 0) return { metrics: "", tps: "" };
	const cache = totals.cacheRead + totals.cacheWrite;
	const rawTotal = totals.input + totals.output + cache;
	const total = compactTokens(rawTotal);
	const input = compactTokens(totals.input);
	const output = compactTokens(totals.output);
	const cachePercentage = Number((rawTotal > 0 ? cache / rawTotal * 100 : 0).toFixed(1));
	const cached = `${compactTokens(cache)} ${cachePercentage}%`;
	const tps = `TPS ${rate === null ? "—" : Number(rate.toFixed(1))}`;
	const variants = [
		`tokens ${total} · ${input} · ${output} · cache ${cached}`,
		`t ${total} · ${input} · ${output} · c ${cached}`,
		`t ${total} ${input} ${output} c ${cached}`,
		`t ${total} c ${cached}`,
		`t ${total}`,
		total,
	];
	// Preserve TPS as labels/detail shrink; at tiny widths truncate TPS alone.
	const metrics = variants.find((text) => visibleWidth(`${text} · ${tps}`) <= width);
	return {
		metrics: metrics === undefined ? "" : `${metrics} · `,
		tps: stripVTControlCharacters(truncateToWidth(tps, width, "…")),
	};
}

function formatCwdRow(cwd: string, width: number): string {
	if (width <= 0) return "";
	// Strip terminal commands before replacing remaining control/line separators.
	const path = stripVTControlCharacters(cwd).replace(/[\x00-\x1f\x7f-\x9f\u2028\u2029]/g, "?");
	return stripVTControlCharacters(truncateToWidth(path, width, "…"));
}

function responseRate(output: number | undefined, startedAt: number, now: number): number | null {
	const seconds = (now - startedAt) / 1000;
	if (output === undefined || !Number.isFinite(output) || output <= 0 || !Number.isFinite(seconds) || seconds <= 0) return null;
	const rate = output / seconds;
	return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export default function herdrSessionDisplay(pi: ExtensionAPI, now: () => number = () => performance.now()) {
	let startingCwd: string | undefined;
	let requestRender: (() => void) | undefined;
	let active: { startedAt: number; rate: number | null } | undefined;
	let completedRate: number | null = null;

	pi.on("session_start", (_event, ctx) => {
		active = undefined;
		completedRate = null;
		if (ctx.mode !== "tui") return;
		startingCwd ??= resolve(ctx.cwd);
		const cwd = startingCwd;
		ctx.ui.setWidget("herdr-session-display-cwd", (tui, theme) => {
			requestRender = () => tui.requestRender();
			requestRender();
			return {
				// Display context only. Herdr Space and agent names remain entirely user-owned.
				render: (width) => {
					const rate = active ? active.rate : completedRate;
					const { metrics, tps } = formatUsageRow(aggregateBranchUsage(ctx.sessionManager.getBranch()), width, rate);
					return [
						theme.fg("dim", metrics) + theme.fg(active && rate !== null ? "accent" : "dim", tps),
						theme.fg("dim", formatCwdRow(cwd, width)),
					];
				},
				// No cached strings: render always uses the callback's current theme and branch.
				invalidate() {},
			};
		}, { placement: "belowEditor" });
	});

	pi.on("message_start", (event, ctx) => {
		if (ctx.mode !== "tui" || startingCwd === undefined || event.message.role !== "assistant") return;
		active = { startedAt: now(), rate: null };
		requestRender?.();
	});
	pi.on("message_update", (event, ctx) => {
		if (ctx.mode !== "tui" || event.message.role !== "assistant" || !active) return;
		const message = event.message;
		if (message.stopReason === "error" || message.stopReason === "aborted" || message.stopReason === "deferred") {
			active = undefined;
		} else {
			// SDK snapshots are cumulative. Output already includes reasoning tokens.
			active.rate = responseRate(message.usage?.output, active.startedAt, now());
		}
		requestRender?.();
	});
	pi.on("message_end", (event, ctx) => {
		if (ctx.mode !== "tui" || event.message.role !== "assistant" || !active) return;
		const message = event.message;
		if (message.stopReason === "stop" || message.stopReason === "length" || message.stopReason === "toolUse") {
			// Observed message-start-to-end response average, not provider decoding speed.
			const rate = responseRate(message.usage?.output, active.startedAt, now());
			if (rate !== null) completedRate = rate;
		}
		active = undefined;
		requestRender?.();
	});

	for (const event of ["turn_end", "agent_start", "agent_end", "agent_settled", "session_compact"] as const) {
		pi.on(event, () => {
			active = undefined;
			requestRender?.();
		});
	}
	for (const event of ["session_switch", "session_fork", "session_tree"] as const) {
		pi.on(event, () => {
			active = undefined;
			completedRate = null;
			requestRender?.();
		});
	}
	pi.on("session_shutdown", () => {
		active = undefined;
		completedRate = null;
		requestRender = undefined;
		startingCwd = undefined;
	});
}
