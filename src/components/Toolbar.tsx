import { Button } from './ui/button';
import { 
  Rotate3D, 
  Ruler, 
  MousePointer2, 
  Move, 
  Minimize2, 
  Maximize2, 
  CircleDot, 
  Stethoscope,
  Scissors,
  StickyNote
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ToolbarProps {
  activeMode: 'view' | 'pick' | 'measure' | 'push' | 'smooth' | 'scale' | 'margin' | 'occlusal' | 'section' | 'note';
  setActiveMode: (mode: 'view' | 'pick' | 'measure' | 'push' | 'smooth' | 'scale' | 'margin' | 'occlusal' | 'section' | 'note') => void;
}

const Toolbar = ({ activeMode, setActiveMode }: ToolbarProps) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2 flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'view' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('view')}
            >
              <Rotate3D className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rotate View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'pick' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('pick')}
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Place Points</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'measure' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('measure')}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Measure Distance</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'margin' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('margin')}
            >
              <CircleDot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Margin Line Tool</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'occlusal' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('occlusal')}
            >
              <Stethoscope className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Occlusal Analysis</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'section' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('section')}
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cross Section View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'push' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('push')}
            >
              <Move className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Push/Pull Tool</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'smooth' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('smooth')}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Smooth Tool</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'scale' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('scale')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Scale Tool</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeMode === 'note' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveMode('note')}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Note</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default Toolbar;
