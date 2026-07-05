"""
Lightweight auto-triage scoring for queue submissions.

This assigns a *starting* triage level so a patient has a queue position
immediately after verifying their code — clinical staff can (and should)
override it once vitals are actually taken, which is what the
`triageOverride` flag on QueueEntry tracks.

Levels follow the A–E convention: 1=A (most urgent) ... 5=E (least urgent).
"""

LEVEL_TO_LETTER = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E'}

# Keywords that bump urgency regardless of self-reported pain score.
# Intentionally conservative — false positives (over-triaging) are far
# safer than false negatives here.
CRITICAL_KEYWORDS = [
    'chest pain', "can't breathe", 'cannot breathe', 'shortness of breath',
    'unconscious', 'unresponsive', 'severe bleeding', 'heavy bleeding',
    'stroke', 'seizure', 'overdose', 'suicidal', 'anaphylaxis',
]
URGENT_KEYWORDS = [
    'fracture', 'broken bone', 'high fever', 'vomiting blood',
    'severe pain', 'difficulty breathing', 'allergic reaction',
]


def compute_triage_level(form: dict) -> tuple[int, str]:
    """
    Returns (level, letter). Inputs come straight off the QueueJoinForm
    payload: isEmergency, painLevel (1-10), reason, symptoms (list[str]).
    """
    reason = (form.get('reason') or '').lower()
    symptoms_text = ' '.join(form.get('symptoms') or []).lower()
    combined = f"{reason} {symptoms_text}"

    pain = form.get('painLevel') or 0
    is_emergency = form.get('isEmergency') == 'Yes'

    if is_emergency and any(k in combined for k in CRITICAL_KEYWORDS):
        level = 1
    elif is_emergency or any(k in combined for k in CRITICAL_KEYWORDS):
        level = 1 if pain >= 8 else 2
    elif any(k in combined for k in URGENT_KEYWORDS) or pain >= 7:
        level = 2
    elif pain >= 5:
        level = 3
    elif pain >= 3:
        level = 4
    else:
        level = 5

    return level, LEVEL_TO_LETTER[level]


# Rough average minutes-per-patient used to estimate wait before a nurse
# has actually triaged someone. Tune against real throughput data.
AVG_MINUTES_BY_LEVEL = {1: 5, 2: 10, 3: 15, 4: 20, 5: 25}


def estimate_wait_minutes(people_ahead: int, triage_level: int) -> int:
    avg = AVG_MINUTES_BY_LEVEL.get(triage_level, 15)
    return max(1, people_ahead * avg)