import os
from collections import defaultdict
import pm4py
from pm4py.objects.log.importer.xes import importer as xes_importer
from pm4py.algo.conformance.alignments.petri_net import algorithm as alignments

def get_activity_deviations(bpmn_path: str, xes_path: str):
    if not os.path.exists(bpmn_path):
        raise FileNotFoundError(f"BPMN file not found: {bpmn_path}")
    if not os.path.exists(xes_path):
        raise FileNotFoundError(f"XES file not found: {xes_path}")

    # Load BPMN and convert to Petri net
    bpmn_model = pm4py.read_bpmn(bpmn_path)
    net, initial_marking, final_marking = pm4py.convert.convert_to_petri_net(bpmn_model)

    # Import XES event log
    log = xes_importer.apply(xes_path)
    total_traces = len(log) if log else 1  # prevent division by zero

    # Compute alignments
    aligned_traces = alignments.apply_log(log, net, initial_marking, final_marking)

    # Count skipped and inserted activities
    skipped = defaultdict(int)
    inserted = defaultdict(int)

    for alignment in aligned_traces:
        for model_move, log_move in alignment['alignment']:
            if model_move == '>>' and log_move not in (None, '>>'):
                inserted[log_move] += 1
            elif log_move == '>>' and model_move not in (None, '>>'):
                skipped[model_move] += 1

    # Combine counts and percentages
    deviations = []
    all_activities = set(skipped.keys()) | set(inserted.keys())
    for activity in all_activities:
        skipped_count = skipped[activity]
        inserted_count = inserted[activity]
        skipped_percent = round((skipped_count / total_traces) * 100, 2)
        inserted_percent = round((inserted_count / total_traces) * 100, 2)

        deviations.append({
            "name": activity,
            "skipped": skipped_count,              # raw count (kept for compatibility)
            "inserted": inserted_count,            # raw count (kept for compatibility)
            "skipped_percent": skipped_percent,    # new field
            "inserted_percent": inserted_percent   # new field
        })

    return {
        "deviations": deviations,
        "total_traces": total_traces
    }
