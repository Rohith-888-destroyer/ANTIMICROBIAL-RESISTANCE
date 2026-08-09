import pandas as pd
from typing import Dict, List, Any

class AMRKnowledgeGraph:
    """
    Constructs multi-relational Knowledge Graph payload connecting:
    Pathogen -> Gene -> Mechanism -> Antimicrobial Class -> Region -> Evidence
    """
    def build_graph(self, df: pd.DataFrame) -> Dict[str, Any]:
        nodes = []
        edges = []
        node_set = set()

        def add_node(node_id: str, label: str, group: str, val: int = 10):
            if node_id not in node_set:
                node_set.add(node_id)
                nodes.append({"id": node_id, "label": label, "group": group, "value": val})

        for idx, row in df.iterrows():
            p_id = f"pathogen_{row['pathogen_name']}"
            g_id = f"gene_{row['gene_symbol']}"
            m_id = f"mech_{row['mechanism']}"
            d_id = f"drug_{row['antimicrobial_class']}"
            r_id = f"region_{row['country_name']}"

            add_node(p_id, row['pathogen_name'], "Pathogen", 25)
            add_node(g_id, row['gene_symbol'], "Gene", 20)
            add_node(m_id, row['mechanism'], "Mechanism", 18)
            add_node(d_id, row['antimicrobial_class'], "Drug Class", 15)
            add_node(r_id, row['country_name'], "Region", 12)

            edges.append({"from": p_id, "to": g_id, "label": "carries"})
            edges.append({"from": g_id, "to": m_id, "label": "confers"})
            edges.append({"from": m_id, "to": d_id, "label": "resists"})
            edges.append({"from": g_id, "to": r_id, "label": "detected_in"})

        # Deduplicate edges
        unique_edges = [dict(t) for t in {tuple(d.items()) for d in edges}]

        return {
            "nodes": nodes,
            "edges": unique_edges
        }
