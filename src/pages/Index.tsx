import { useState } from 'react';
import Toolbar from '../components/Toolbar';
import Viewer3D from '../components/Viewer3D';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Card } from '../components/ui/card';
import { Globe, View, Settings, Users, Award } from 'lucide-react';

const Index = () => {
  const [activeMode, setActiveMode] = useState<'view' | 'pick' | 'measure' | 'push' | 'smooth' | 'scale' | 'margin' | 'occlusal' | 'section' | 'note'>('view');
  const [stlFile, setStlFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.stl')) {
      setStlFile(file);
      toast({
        title: "File uploaded successfully",
        description: `Loaded: ${file.name}`,
      });
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload an STL file",
        variant: "destructive",
      });
    }
  };

  const features = [
    {
      icon: <View className="w-10 h-10 text-primary" />,
      title: "3D Visualization",
      description: "Advanced 3D model viewing with interactive controls"
    },
    {
      icon: <Settings className="w-10 h-10 text-primary" />,
      title: "Precise Tools",
      description: "Comprehensive toolset for dental modifications"
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Collaboration",
      description: "Easy communication between dentists and technicians"
    },
    {
      icon: <Award className="w-10 h-10 text-primary" />,
      title: "Professional Grade",
      description: "High-quality results for dental professionals"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Advanced 3D Dental Visualization
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your dental workflow with our powerful 3D modeling and visualization tools
          </p>
          <Button variant="outline" asChild className="mr-4">
            <label className="cursor-pointer">
              Upload STL File
              <input
                type="file"
                accept=".stl"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
          <Button>Watch Demo</Button>
        </div>

        {/* 3D Viewer Card */}
        <Card className="p-6 shadow-lg rounded-xl bg-white mb-20">
          <div className="relative bg-white rounded-lg" style={{ height: '60vh' }}>
            <Toolbar activeMode={activeMode} setActiveMode={setActiveMode} />
            <Viewer3D stlFile={stlFile} mode={activeMode} />
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Powerful Features for Dental Professionals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Dental Practice?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of dental professionals who trust our platform for their 3D visualization needs
          </p>
          <Button size="lg">
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;