export const DRUG_DATABASE = {
  // CASE 1: CIPLA (Respiratory / Mass Market)
  "foracort": {
    brand: {
      name: "Cipla",
      color: "#00AEEF", // Cipla Blue
      accent: "#F58220", // Apricot Orange
      tagline: "Caring for Life",
      logoType: "image",
      division: "Respiratory Division"
    },
    company: {
      overview: "Cipla Limited is one of India's leading pharmaceutical companies with a global presence across 80+ countries. Founded in 1935 by Dr. K.A. Hamied, Cipla has pioneered affordable healthcare access for millions worldwide.",
      specialties: "Respiratory Care • HIV/AIDS Treatment • Oncology • Cardiology • Anti-infectives",
      stats: {
        founded: "1935",
        headquarters: "Mumbai, India",
        employees: "24,000+",
        revenue: "₹23,456 Cr (FY23)"
      },
      mission: "Making healthcare accessible and affordable globally through innovative drug development and sustainable business practices."
    },
    drug: {
      name: "Foracort",
      subtitle: "Formoterol Fumarate + Budesonide | Inhaler",
      visual: "3d-lungs-bronchi-blue.png",
      description: "2-in-1 Maintenance Therapy for Asthma & COPD."
    },
    mechanism: {
      title: "Synchrobreathe™ Technology",
      text: "Breath-actuated inhaler ensures drug delivery is independent of inspiratory flow rate, reducing coordination errors."
    },
    comparison: {
      competitor: "Salmeterol/Fluticasone",
      rows: [
        { metric: "Onset of Action", value: "1-3 mins", competitorValue: "10-20 mins", winner: true },
        { metric: "Exacerbation Risk", value: "-35%", competitorValue: "Baseline", winner: true },
        { metric: "Pneumonia Risk", value: "Low", competitorValue: "Moderate", winner: true }
      ]
    },
    coverage: {
      ayushman: { status: "COVERED", color: "green", label: "Tier 1" },
      cghs: { status: "APPROVED", color: "blue", label: "General Formulary" },
      private: { status: "WAITING", color: "yellow", label: "24 Mo Pre-existing" }
    },
    compliance: {
      regulatory: {
        status: "APPROVED",
        authority: "FDA/CDSCO",
        icon: "check"
      },
      pregnancy: {
        category: "Class C",
        icon: "warning"
      },
      boxedWarning: {
        status: "None",
        icon: "shield"
      },
      citations: [
        "CDSCO Product Insert [Ref 1]",
        "GINA Guidelines 2024 [Ref 2]",
        "Indian Pharmacopoeia 2023 [Ref 3]"
      ]
    },
    pricing: {
      estimatedCopay: "₹0",
      mrp: "₹850/month"
    }
  },

  // CASE 2: PFIZER (Cardio / Premium Science)
  "eliquis": {
    brand: {
      name: "Pfizer",
      color: "#0033A0", // Pfizer Deep Blue
      accent: "#00B6ED", // Light Blue
      tagline: "Breakthroughs that change patients' lives",
      logoType: "image",
      division: "Cardiovascular Division"
    },
    company: {
      overview: "Pfizer Inc. is a global biopharmaceutical leader, discovering and developing life-changing medicines and vaccines for over 170 years. With a presence in 125+ countries, Pfizer delivers breakthrough innovations that improve patient outcomes.",
      specialties: "Cardiovascular Medicine • Oncology • Immunology • Vaccines • Rare Diseases",
      stats: {
        founded: "1849",
        headquarters: "New York, USA",
        employees: "83,000+",
        revenue: "$100.3 Bn (2023)"
      },
      mission: "Breakthroughs that change patients' lives through science-driven innovation and equitable access to medicines worldwide."
    },
    drug: {
      name: "Eliquis",
      subtitle: "Apixaban | Factor Xa Inhibitor",
      visual: "3d-helix-blood-flow.png",
      description: "Stroke prevention in Non-valvular Atrial Fibrillation (NVAF)."
    },
    mechanism: {
      title: "Direct Factor Xa Inhibition",
      text: "Selectively blocks the active site of Factor Xa, preventing thrombin generation without requiring Antithrombin III."
    },
    comparison: {
      competitor: "Warfarin",
      rows: [
        { metric: "Major Bleeding", value: "-31%", competitorValue: "Baseline", winner: true },
        { metric: "Stroke Reduction", value: "21% RRR", competitorValue: "Baseline", winner: true },
        { metric: "INR Monitoring", value: "None", competitorValue: "Required", winner: true }
      ]
    },
    coverage: {
      ayushman: { status: "RESTRICTED", color: "yellow", label: "Cardiac Only" },
      cghs: { status: "APPROVED", color: "blue", label: "Life Saving Drug" },
      private: { status: "COVERED", color: "green", label: "Day 1" }
    },
    compliance: {
      regulatory: {
        status: "APPROVED",
        authority: "FDA/CDSCO",
        icon: "check"
      },
      pregnancy: {
        category: "Class B",
        icon: "warning"
      },
      boxedWarning: {
        status: "Bleeding Risk",
        icon: "alert"
      },
      citations: [
        "CDSCO Product Insert [Ref 1]",
        "ARISTOTLE Trial 2011 [Ref 2]",
        "Indian Guidelines on AF [Ref 3]"
      ]
    },
    pricing: {
      estimatedCopay: "₹2,400",
      mrp: "₹8,500/month"
    }
  },

  // CASE 3: JOHNSON & JOHNSON (Immunology / Biotech)
  "tremfya": {
    brand: {
      name: "Johnson & Johnson",
      color: "#D51900", // J&J Red
      accent: "#C8102E", // Darker Red
      tagline: "Profound Impact",
      logoType: "image",
      division: "Immunology Division"
    },
    company: {
      overview: "Johnson & Johnson is the world's largest and most diversified healthcare company, operating for over 135 years. Through its pharmaceutical division, Janssen, J&J leads innovation in immunology, oncology, neuroscience, and infectious diseases.",
      specialties: "Immunology • Oncology • Cardiovascular • Neuroscience • Infectious Disease",
      stats: {
        founded: "1886",
        headquarters: "New Brunswick, USA",
        employees: "152,000+",
        revenue: "$94.9 Bn (2023)"
      },
      mission: "Blending heart, science, and ingenuity to profoundly change the trajectory of health for humanity through transformative innovations."
    },
    drug: {
      name: "Tremfya",
      subtitle: "Guselkumab | IL-23 Inhibitor",
      visual: "3d-cellular-repair-red.png",
      description: "First-in-class biologic for moderate to severe Plaque Psoriasis."
    },
    mechanism: {
      title: "Selective IL-23 Blockade",
      text: "Targets the p19 subunit of interleukin-23, stopping the inflammatory cytokine cascade at the source."
    },
    comparison: {
      competitor: "Cosentyx (Secukinumab)",
      rows: [
        { metric: "PASI 90 (Week 48)", value: "84%", competitorValue: "70%", winner: true },
        { metric: "Dosing Freq", value: "8 Weeks", competitorValue: "4 Weeks", winner: true },
        { metric: "Clean Skin (IGA 0)", value: "High", competitorValue: "Moderate", winner: true }
      ]
    },
    coverage: {
      ayushman: { status: "NOT COVERED", color: "grey", label: "Biologic Excl." },
      cghs: { status: "SPECIAL AUTH", color: "yellow", label: "Committee Appr." },
      private: { status: "CO-PAY", color: "blue", label: "20% Patient Pay" }
    },
    compliance: {
      regulatory: {
        status: "APPROVED",
        authority: "FDA/CDSCO",
        icon: "check"
      },
      pregnancy: {
        category: "Class C",
        icon: "warning"
      },
      boxedWarning: {
        status: "Infection Risk",
        icon: "alert"
      },
      citations: [
        "CDSCO Product Insert [Ref 1]",
        "VOYAGE 1 & 2 Trials [Ref 2]",
        "IADVL Guidelines 2024 [Ref 3]"
      ]
    },
    pricing: {
      estimatedCopay: "₹45,000",
      mrp: "₹1,85,000/dose"
    }
  },

  // Legacy support - Jardiance maps to Foracort for demo
  "jardiance": {
    brand: {
      name: "Cipla",
      color: "#00AEEF",
      accent: "#F58220",
      tagline: "Caring for Life",
      logoType: "image",
      division: "Metabolic Division"
    },
    company: {
      overview: "Cipla Limited is one of India's leading pharmaceutical companies with a global presence across 80+ countries. Founded in 1935 by Dr. K.A. Hamied, Cipla has pioneered affordable healthcare access for millions worldwide.",
      specialties: "Respiratory Care • HIV/AIDS Treatment • Oncology • Cardiology • Anti-infectives",
      stats: {
        founded: "1935",
        headquarters: "Mumbai, India",
        employees: "24,000+",
        revenue: "₹23,456 Cr (FY23)"
      },
      mission: "Making healthcare accessible and affordable globally through innovative drug development and sustainable business practices."
    },
    drug: {
      name: "Jardiance",
      subtitle: "Empagliflozin 10mg | SGLT2 Inhibitor",
      visual: "3d-crystal-teal.png",
      description: "Cardiovascular and renal protection in Type 2 Diabetes."
    },
    mechanism: {
      title: "SGLT2 Inhibition",
      text: "Blocks sodium-glucose cotransporter 2 in the kidneys, preventing glucose reabsorption and promoting urinary glucose excretion."
    },
    comparison: {
      competitor: "Placebo",
      rows: [
        { metric: "HbA1c Reduction", value: "-0.8%", competitorValue: "-0.1%", winner: true },
        { metric: "Weight Loss", value: "-2.8 kg", competitorValue: "-0.4 kg", winner: true },
        { metric: "CV Death Risk", value: "-38%", competitorValue: "Baseline", winner: true }
      ]
    },
    coverage: {
      ayushman: { status: "COVERED", color: "green", label: "Tier 1" },
      cghs: { status: "APPROVED", color: "blue", label: "General Formulary" },
      private: { status: "WAITING", color: "yellow", label: "Star Health" }
    },
    compliance: {
      regulatory: {
        status: "APPROVED",
        authority: "FDA/CDSCO",
        icon: "check"
      },
      pregnancy: {
        category: "Class C",
        icon: "warning"
      },
      boxedWarning: {
        status: "None",
        icon: "shield"
      },
      citations: [
        "CDSCO Product Insert [Ref 1]",
        "EMPA-REG OUTCOME Trial [Ref 2]",
        "Indian Diabetes Guidelines 2024 [Ref 3]"
      ]
    },
    pricing: {
      estimatedCopay: "₹0",
      mrp: "₹1,200/month"
    }
  }
};

export type DrugData = typeof DRUG_DATABASE[keyof typeof DRUG_DATABASE];