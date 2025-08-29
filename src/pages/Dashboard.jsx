
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  FileText, 
  Heart, 
  Activity, 
  UserPlus,
  Search,
  Users2,
  Package,
  BookOpenCheck
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { residents } = useData();
  const [isResidentSelectOpen, setIsResidentSelectOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedResident, setSelectedResident] = useState('');

  const sortedResidents = useMemo(() => 
    [...residents].sort((a, b) => a.name.localeCompare(b.name)),
  [residents]);

  const userRole = user?.profile?.role;

  const menuItems = [
    { title: 'Buscar Residentes', description: 'Pesquisar e visualizar prontuários', icon: Search, path: '/residentes', color: 'bg-primary', available: true },
    { title: 'Gerenciar Residentes', description: 'Cadastrar e editar dados de residentes', icon: UserPlus, path: '/gerenciar-residentes', color: 'bg-green-500', available: ['supervisor', 'administrador'].includes(userRole) },
    { title: 'Gerenciar Usuários', description: 'Adicionar e editar usuários do sistema', icon: Users2, path: '/gerenciar-usuarios', color: 'bg-blue-500', available: ['administrador'].includes(userRole) },
    { title: 'Estoque de Medicação', description: 'Controlar estoque individual dos residentes', icon: Package, path: '/residentes?openStock=true', color: 'bg-yellow-500', available: ['supervisor', 'administrador'].includes(userRole) }
  ];

  const features = [
    { title: 'Prescrição Médica', description: 'Controle de medicamentos', icon: FileText, color: 'bg-purple-500', tab: 'prescription', available: !['terceirizado'].includes(userRole) },
    { title: 'Cuidados de Enfermagem', description: 'Procedimentos especializados', icon: Heart, color: 'bg-pink-500', tab: 'nursing', available: !['terceirizado'].includes(userRole) },
    { title: 'Controle Básico', description: 'Evacuação, banho e alimentação', icon: Users, color: 'bg-orange-500', tab: 'basic', available: !['terceirizado'].includes(userRole) },
    { title: 'Sinais Vitais', description: 'Pressão, frequência, etc.', icon: Activity, color: 'bg-destructive', tab: 'vitals', available: !['terceirizado'].includes(userRole) },
    { title: 'Evoluções', description: 'Registro de acompanhamento', icon: BookOpenCheck, color: 'bg-teal-500', tab: 'evolutions', available: true }
  ];
  
  const orderedFeatures = [
      ...features.filter(f => f.tab !== 'evolutions'),
      features.find(f => f.tab === 'evolutions')
  ].filter(Boolean);

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setIsResidentSelectOpen(true);
  };
  
  const handleSelectResident = () => {
    if (selectedResident && selectedFeature) {
      setIsResidentSelectOpen(false);
      navigate(`/residente/${selectedResident}/${selectedFeature.tab}`);
      setSelectedResident('');
      setSelectedFeature(null);
    }
  };

  return (
    <Layout title="Painel Principal">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {menuItems.map((item, index) => {
          if (!item.available) return null;
          return (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card className="bg-card hover:border-primary transition-all duration-300 cursor-pointer group h-full" onClick={() => navigate(item.path)}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}><item.icon className="h-6 w-6 text-white" /></div>
                  <CardTitle className="text-foreground">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <h3 className="text-2xl font-bold text-foreground mb-6">Funcionalidades do Prontuário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {orderedFeatures.map((feature, index) => {
            if (!feature.available) return null;
            return (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}>
                <Card className="bg-card h-full cursor-pointer hover:border-primary transition-all duration-300 group" onClick={() => handleFeatureClick(feature)}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}><feature.icon className="h-8 w-8 text-white" /></div>
                    <CardTitle className="text-foreground text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
      
      <Dialog open={isResidentSelectOpen} onOpenChange={setIsResidentSelectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Residente para ver {selectedFeature?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={setSelectedResident} value={selectedResident}>
              <SelectTrigger><SelectValue placeholder="Escolha um residente..." /></SelectTrigger>
              <SelectContent>
                {sortedResidents.map(resident => <SelectItem key={resident.id} value={resident.id}>{resident.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSelectResident} disabled={!selectedResident} className="w-full">Ir para Prontuário</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
