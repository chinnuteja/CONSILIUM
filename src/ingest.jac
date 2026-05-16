def get_phase2_medqa_case() -> dict {
    return {
        "case_id": "medqa_test_51",
        "question": "A 56-year-old man with a history of hypertension presents to his physician with progressive fatigue and new onset muscle cramps. He has had no recent changes to his medication regimen, which includes hydrochlorothiazide, lisinopril, and amlodipine. His temperature is 98.0°F (36.7°C), blood pressure is 174/111 mmHg, pulse is 70/min, respirations are 12/min, and oxygen saturation is 98% on room air. The patient's cardiopulmonary and abdominal exams are unremarkable. Laboratory values are ordered as seen below. Serum: Na+: 138 mEq/L, Cl-: 100 mEq/L, K+: 3.3 mEq/L, HCO3-: 33 mEq/L, BUN: 20 mg/dL, Glucose: 129 mg/dL. What is the most likely underlying etiology of this patient's hypertension?",
        "answer": "Aldosterone excess",
        "options": {
            "A": "Aldosterone excess",
            "B": "Catecholamine-secreting mass",
            "C": "Cortisol excess",
            "D": "Impaired kidney perfusion"
        },
        "evidence": [
            {"kind": "History", "code": "H1", "text": "History of hypertension on hydrochlorothiazide, lisinopril, and amlodipine with no recent medication changes."},
            {"kind": "Symptom", "code": "S1", "text": "Progressive fatigue and new onset muscle cramps."},
            {"kind": "Lab", "code": "L1", "text": "Blood pressure is 174/111 mmHg."},
            {"kind": "Lab", "code": "L2", "text": "Potassium is low at 3.3 mEq/L."},
            {"kind": "Lab", "code": "L3", "text": "Bicarbonate is elevated at 33 mEq/L."},
            {"kind": "Lab", "code": "L4", "text": "Glucose is mildly elevated at 129 mg/dL."}
        ]
    };
}
