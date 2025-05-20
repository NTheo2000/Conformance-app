import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { useFileContext } from './FileContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import InfoIcon from '@mui/icons-material/Info';
import { ActivityDeviation } from './FileContext';


const COLORS = {
  red: { stroke: 'red', fill: 'lightpink' },
  orange: { stroke: 'orange', fill: '#FFD580' },
  green: { stroke: 'green', fill: 'lightgreen' },
};

const ViewBPMN: React.FC = () => {
  const navigate = useNavigate();
  const bpmnContainerRef = useRef<HTMLDivElement | null>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const { bpmnFileContent, setExtractedElements, activityDeviations } = useFileContext();


  const [activityCounts, setActivityCounts] = useState({
    red: 0,
    orange: 0,
    green: 0,
  });

  const [activityStats, setActivityStats] = useState<{ [key: string]: { skipped: number; inserted: number } }>({});


  const disableHoverEffects = () => {
    if (modelerRef.current) {
      const eventBus = modelerRef.current.get('eventBus') as any;
      eventBus.off('element.hover');
      eventBus.off('element.out');
    }
  };

  const highlightActivity = (activityId: string, color: { stroke: string; fill: string }) => {
    if (modelerRef.current) {
      const elementRegistry = modelerRef.current.get('elementRegistry') as any;
      const modeling = modelerRef.current.get('modeling') as any;
  
      const element = elementRegistry.get(activityId);
      if (element) {
        modeling.setColor([element], color);
        
        // Change text color to black for visibility
        const gfx = document.querySelector(`[data-element-id="${activityId}"] text`);
        if (gfx) {
          if (gfx) {
            if (gfx) {
              (gfx as SVGTextElement).style.fill = 'black';
              (gfx as SVGTextElement).style.fontWeight = 'bold';
            }
            
          }
          
        }
      } else {
        console.warn(`Element with ID ${activityId} not found`);
      }
    }
  };
  
  

  const gradientColors = [
    '#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
    '#ef3b2c', '#cb181d', '#a50f15', '#67000d'
  ];
  function isDarkColor(hex: string): boolean {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  
  
  
  const applyColors = (deviations: { [activityId: string]: { skipped: number; inserted: number } }) => {
    const totalDeviations = Object.values(deviations).map(d => d.skipped + d.inserted);
    const sorted = [...totalDeviations].sort((a, b) => a - b);
  
    // 10% quantile thresholds
    const quantiles: number[] = [];
    for (let i = 0; i < 9; i++) {
      const index = Math.floor((i / 9) * sorted.length);
      quantiles.push(sorted[index]);
    }
  
    Object.entries(deviations).forEach(([activityId, d]) => {
      const total = d.skipped + d.inserted;
      const index = quantiles.findIndex(q => total <= q);
      const color = gradientColors[index >= 0 ? index : gradientColors.length - 1];
  
      const element = (modelerRef.current?.get('elementRegistry') as any)?.get(activityId);
  
      if (element) {
        (modelerRef.current?.get('modeling') as any)?.setColor([element], {
          stroke: color,
          fill: color,
        });
  
        const gfx = document.querySelector(`[data-element-id="${element.id}"] text`);
        if (gfx) {
          if (gfx) {
            const textColor = color.toLowerCase() === '#67000d' ? 'white' : 'black';
            (gfx as SVGTextElement).style.fill = textColor;
            (gfx as SVGTextElement).style.fontWeight = 'bold';
          }
          



        }
        
      }
    });
  };
  
  
  
  
  

  useEffect(() => {
    if (bpmnFileContent && bpmnContainerRef.current) {
      if (!modelerRef.current) {
        modelerRef.current = new BpmnModeler({
          container: bpmnContainerRef.current,
        });
      }

      
      

      modelerRef.current
        .importXML(bpmnFileContent)
        .then(() => {
          const canvas = modelerRef.current!.get('canvas') as any;
          const elementRegistry = modelerRef.current!.get('elementRegistry') as any;

          const elements = elementRegistry
          .getAll()
          .filter((element: any) => element.type === 'bpmn:Task');
        
        const extractedElements = elements.map((element: any) => ({
          id: element.id,
          name: element.businessObject.name || 'Unnamed Task',
        }));
        
        setExtractedElements(extractedElements);
        
        const realStats = extractedElements.reduce(
          (acc: Record<string, { skipped: number; inserted: number }>, activity: { id: string; name: string }) => {
            const deviation = activityDeviations.deviations.find((d) => d.name === activity.name);
            acc[activity.id] = {
              skipped: deviation?.skipped || 0,
              inserted: deviation?.inserted || 0,
            };
            return acc;
          },
          {} as Record<string, { skipped: number; inserted: number }>
        );
        
 
        
        
        setActivityStats(realStats);
        console.log("Updated activityStats:", realStats);
        applyColors(realStats);

        
          canvas.zoom('fit-viewport');
          disableHoverEffects();
          
          const eventBus = modelerRef.current!.get('eventBus') as any;
          eventBus.on('element.hover', (event: any) => {
            const element = event.element;
            if (element.type === 'bpmn:Task') {
              const statsBox = document.createElement('div');
              statsBox.className = 'hover-stats-box';
              statsBox.style.position = 'absolute';
              statsBox.style.backgroundColor = 'rgba(255,255,255,0.95)';
              statsBox.style.color = '#1565c0';
              statsBox.style.padding = '8px';
              statsBox.style.borderRadius = '4px';
              statsBox.style.pointerEvents = 'none';
              statsBox.style.zIndex = '1000';
              statsBox.style.width = '200px'; // or even 220px for more comfort
              statsBox.style.padding = '10px'; // slightly more padding

          
              // ✅ Use `generatedStats` instead of outdated `activityStats`
              const stats: ActivityDeviation = 
              activityDeviations.deviations.find((d) => d.name === element.businessObject.name)
              || { name: '', skipped: 0, inserted: 0, skipped_percent: 0, inserted_percent: 0 };
            





          
              statsBox.innerHTML = `
              <div style="margin-bottom: 8px; text-align: center; font-weight: bold; color: white; background-color: black; padding: 4px; border-radius: 4px;">
                Activity Stats
              </div>
            
              <div style="display: flex; justify-content: flex-start; gap: 8px; margin: 6px 0; font-size: 14px;">
                <span style="font-weight: bold; color: black;">Times Skipped:</span>
                <span style="color: black; font-weight: 500;">
                  ${stats.skipped} (${stats.skipped_percent.toFixed(1)}%)
                </span>
              </div>
            
              <div style="display: flex; justify-content: flex-start; gap: 8px; margin-top: 4px; font-size: 14px;">
                <span style="font-weight: bold; color: black;">Times Inserted:</span>
                <span style="color: black; font-weight: 500;">
                  ${stats.inserted} (${stats.inserted_percent.toFixed(1)}%)
                </span>
              </div>
            `;
            
            
            
          
              document.body.appendChild(statsBox);
          
              const onMove = (mouseEvent: MouseEvent) => {
                statsBox.style.left = `${mouseEvent.pageX + 10}px`;
                statsBox.style.top = `${mouseEvent.pageY + 10}px`;
              };
          
              document.addEventListener('mousemove', onMove);
          
              eventBus.once('element.out', () => {
                document.body.removeChild(statsBox);
                document.removeEventListener('mousemove', onMove);
              });
            }
          });
          
        })
        .catch((error: unknown) => {
          console.error('Error rendering BPMN diagram:', error);
        });
    }

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [bpmnFileContent, setExtractedElements]);


  
  
  
  

  const handleZoomIn = () => {
    const canvas = modelerRef.current?.get('canvas') as any;
    canvas?.zoom(canvas.zoom() + 0.2);
  };

  const handleZoomOut = () => {
    const canvas = modelerRef.current?.get('canvas') as any;
    canvas?.zoom(canvas.zoom() - 0.2);
  };

  const handleResetZoom = () => {
    const canvas = modelerRef.current?.get('canvas') as any;
    canvas?.zoom('fit-viewport');
  };

  const data = [
    { name: 'Low Conformance', value: activityCounts.red, color: COLORS.red.fill },
    { name: 'Medium Conformance', value: activityCounts.orange, color: COLORS.orange.fill },
    { name: 'High Conformance', value: activityCounts.green, color: COLORS.green.fill },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: 4 }}>
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
        <Typography variant="h4" gutterBottom>
          BPMN File Viewer
        </Typography>
        <Tooltip title="Where exactly does the process execution differ from the guideline? How does alternative behavior look like? This can relate to different control-flow relations, but also resource and data constraints. It can be explored on an event, trace, and log level. The task is similar 'Describe-Identify-Guideline Violation', but here the violation is not presented but needs to be explored by the analyst." arrow>
          <IconButton>
            <InfoIcon color="primary" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        ref={bpmnContainerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginTop: 2,
          overflow: 'hidden',
        }}
      >
{/* Gradient Scale Bar */}
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px 0',
    marginTop: 2,
  }}
>
  <Typography variant="body2" sx={{ marginRight: 2, fontWeight: 'bold' }}>
    High Conformance
  </Typography>
  <Box
    sx={{
      width: '300px',
      height: '15px',
      background: `linear-gradient(to right, ${gradientColors.join(', ')})`,
      borderRadius: '4px',
      border: '1px solid #ccc',
    }}
  />
  <Typography variant="body2" sx={{ marginLeft: 2, fontWeight: 'bold' }}>
    Low Conformance
  </Typography>
</Box>

      </Box>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ marginTop: 2 }}>
        <Button variant="contained" onClick={handleZoomIn}>
          Zoom In
        </Button>
        <Button variant="contained" onClick={handleZoomOut}>
          Zoom Out
        </Button>
        <Button variant="contained" onClick={handleResetZoom}>
          Reset View
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ marginTop: 4, width: '100%' }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ marginLeft: 2, fontSize: '1.5rem', fontWeight: 'bold' }}
          onClick={() => navigate('/')}
        >
          ←
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ marginRight: 2, fontSize: '1.5rem', fontWeight: 'bold' }}
          onClick={() => navigate('/activity-stats')}
        >
          →
        </Button>
      </Stack>
    </Box>
  );
};

export default ViewBPMN;



























































































































































