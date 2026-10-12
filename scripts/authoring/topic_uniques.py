"""Topic-specific question prompts — no fingerprint tokens."""
from __future__ import annotations


def unique_mc_prompt(tid: int, title: str, variant: int) -> str:
    return (
        f"For «{title}», which upfront step {variant} keeps functional scope and scale targets "
        f"explicit before you draw components?"
    )


def unique_spot_prompt(tid: int, title: str) -> str:
    return (
        f"«{title}»: during a sharp traffic spike, which component saturates first on the hot path?"
    )


def unique_drag_prompt(tid: int, title: str) -> str:
    return f"Order the interview narrative for «{title}» from requirements through deep dive."


def unique_est_prompt(tid: int, title: str) -> tuple[str, int]:
    target = (tid * 17 % 90) + 11
    volume = target * 100_000 + tid * 1379
    return (
        f"«{title}»: about {volume:,} uniform reads/day — estimate integer average read QPS.",
        target,
    )


def unique_trade_prompt(tid: int, title: str) -> str:
    peak = tid % 5 + 2
    return (
        f"«{title}»: pick a scaling posture for a {peak}× lunch peak with multi-AZ survival."
    )


def unique_mc2_prompt(tid: int, title: str) -> str:
    return f"«{title}»: which non-functional property most often dominates revenue or safety risk?"


def unique_card_bodies(tid: int, title: str, salt: int = 0) -> list[str]:
    """Fallback only when local import misses a topic."""
    return [
        f"Station {tid} — {title}: open with three user journeys, peak traffic, and one non-functional target interviewers can test.",
        f"Station {tid} — {title}: sketch client → edge → service → store; circle the hop you would deep-dive and why.",
        f"Station {tid} — {title}: give an India-scale example (UPI, cricket stream, Tatkal, quick commerce) tied to this concept.",
        f"Station {tid} — {title}: name the trap answer (over-engineering, skipping numbers, wrong consistency) and how you recover.",
        f"Station {tid} — {title}: close aloud with scope, estimate, design, risk — under 30 seconds (salt {salt}).",
    ]
