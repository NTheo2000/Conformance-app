import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ExtractedElement {
  id: string;
  name: string;
}

interface TraceFitness {
  trace: string;
  conformance: number;
}
interface OutcomeBin {
  range: [number, number];
  traceCount: number;
  percentageEndingCorrectly: number;
}
interface RoleConformance {
  role: string;
  averageConformance: number;
  traceCount: number;
}


interface ConformanceBin {
  averageConformance: number;
  traceCount: number;
}

interface ActivityDeviation {
  name: string;
  skipped: number;
  inserted: number;
}

interface FileContextType {
  // File contents
  bpmnFileContent: string | null;
  xesFileContent: string | null;

  // Extracted BPMN elements
  extractedElements: ExtractedElement[];

  // Conformance data
  fitnessData: TraceFitness[];
  conformanceBins: ConformanceBin[];

  // Activity deviation stats
  activityDeviations: ActivityDeviation[];
  outcomeBins: OutcomeBin[];
 desiredOutcomes: string[];
 roleConformance: RoleConformance[];

  // Setters
  setBpmnFileContent: (content: string | null) => void;
  setXesFileContent: (content: string | null) => void;
  setExtractedElements: (elements: ExtractedElement[]) => void;
  setFitnessData: (data: TraceFitness[]) => void;
  setConformanceBins: (bins: ConformanceBin[]) => void;
  setActivityDeviations: (data: ActivityDeviation[]) => void;
  setOutcomeBins: (bins: OutcomeBin[]) => void;
  setDesiredOutcomes: (outcomes: string[]) => void;
  setRoleConformance: (data: RoleConformance[]) => void;

  // Outcome distribution

}

// Create context
const FileContext = createContext<FileContextType | undefined>(undefined);

// Provider component
export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [bpmnFileContent, setBpmnFileContent] = useState<string | null>(null);
  const [xesFileContent, setXesFileContent] = useState<string | null>(null);
  const [extractedElements, setExtractedElements] = useState<ExtractedElement[]>([]);
  const [fitnessData, setFitnessData] = useState<TraceFitness[]>([]);
  const [conformanceBins, setConformanceBins] = useState<ConformanceBin[]>([]);
  const [activityDeviations, setActivityDeviations] = useState<ActivityDeviation[]>([]);
  const [outcomeBins, setOutcomeBins] = useState<OutcomeBin[]>([]);
  const [desiredOutcomes, setDesiredOutcomes] = useState<string[]>([]);
  const [roleConformance, setRoleConformance] = useState<RoleConformance[]>([]);




  return (
    <FileContext.Provider
      value={{
        bpmnFileContent,
        xesFileContent,
        extractedElements,
        setBpmnFileContent,
        setXesFileContent,
        setExtractedElements,
        fitnessData,
        setFitnessData,
        conformanceBins,
        setConformanceBins,
        activityDeviations,
        setActivityDeviations,
        outcomeBins,
setOutcomeBins,
desiredOutcomes,
setDesiredOutcomes,
roleConformance,
  setRoleConformance,

      }}
    >
      {children}
    </FileContext.Provider>
  );
};

// Hook for using context
export const useFileContext = (): FileContextType => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};



