# Model Card: AMR-Sentinel Intelligence Models

## Model Overview
- **Model Names**: 
  - `Resistance Velocity Engine` ($v = \frac{df}{dt}$)
  - `Genomic Novelty IsolationForest` (`amr-isolation-forest-v1`)
  - `Sentinel Score Multi-Dimensional Scorer`
- **Model Version**: `1.0.0`
- **Release Date**: August 2026

---

## Intended Use
- **Primary Use**: Autonomous early-warning surveillance for public health researchers and bioinformaticians to flag accelerating antimicrobial resistance signals and novel genomic isolate profiles.
- **Out-of-Scope / Prohibited Use**: 
  - Clinical patient infection diagnosis.
  - Antibiotic treatment selection or dosage recommendations for individuals.
  - Confirmation of outbreaks or direct causal transmission proof without field epidemiological investigation.

---

## Technical Methodology & Formulas
1. **Observed Resistance Signal Velocity**:
   $$v = \frac{df}{dt}$$
   Evaluates the monthly frequency change rate of pathogen-gene combinations across sliding 30-day temporal windows.

2. **Temporal Acceleration**:
   $$a = \frac{d^2f}{dt^2}$$
   Measures whether observed signal increases are accelerating or stabilizing.

3. **Genomic Novelty Score**:
   Trained using an unsupervised `IsolationForest` on isolate k-mer hash features and metadata matrices to flag atypical sequence profiles.

4. **Sentinel Score (0–100)**:
   $$S = \text{Trend}(30\%) + \text{Novelty}(25\%) + \text{Geographic Expansion}(20\%) + \text{Coverage}(15\%) + \text{Temporal Consistency}(10\%)$$

---

## Data Bias & Surveillance Blind Spots
Public genomic repositories exhibit unequal sampling across global regions:
- High-income regions (North America, Western Europe) maintain high sequencing throughput.
- Low-resource regions (sub-Saharan Africa, parts of Latin America) have sparse sequence metadata.

**Crucial System Guarantee**: A region with low reported observations is classified on the **Data Blind Spots** map as *Insufficient Coverage*, rather than assuming "Low AMR Risk".

---

## Evaluation & Verification
- Validated via `pytest` temporal sanity checks in `tests/test_pipeline.py`.
- No synthetic or fabricated data is presented as biological observation.
