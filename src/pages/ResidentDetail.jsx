
import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrescriptionTab from '@/components/resident/PrescriptionTab';
import NursingCareTab from '@/components/resident/NursingCareTab';
import BasicCareTab from '@/components/resident/BasicCareTab';
import VitalSignsTab from '@/components/resident/VitalSignsTab';
import EvolutionTab from '@/components/resident/EvolutionTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, FileText, Heart, Users, Activity, Stethoscope, ShieldCheck, Bed, ClipboardList, FileHeart, BookOpenCheck } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';

export default function ResidentDetail() {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const { residents } = useData();
  const { user } = useAuth();
  
  const resident = residents.find(p => p.id === id);
  const userRole = user?.profile?.role;

  if (!resident) {
    return (
      <Layout title="Residente não encontrado" showBackButton={true}>
        <Card><CardContent className="text-center py-12"><User className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Residente não encontrado</h3><p className="text-muted-foreground">O residente solicitado não existe ou foi removido.</p></CardContent></Card>
      </Layout>
    );
  }

  const canEdit = ['supervisor', 'administrador', 'cuidador', 'medico_geriatra'].includes(userRole);
  const isTerceirizado = userRole === 'terceirizado';

  const tabList = [
    { value: "prescription", label: "Prescrição Médica", icon: FileText, available: !isTerceirizado },
    { value: "nursing", label: "Cuidados de Enfermagem", icon: Heart, available: !isTerceirizado },
    { value: "basic", label: "Controle Básico", icon: Users, available: !isTerceirizado },
    { value: "vitals", label: "Sinais Vitais", icon: Activity, available: !isTerceirizado },
    { value: "evolutions", label: "Evoluções", icon: BookOpenCheck, available: true },
  ];

  const orderedTabList = [
    ...tabList.filter(t => t.value !== 'evolutions'),
    tabList.find(t => t.value === 'evolutions')
  ].filter(Boolean);

  const availableTabs = orderedTabList.filter(t => t.available).map(t => t.value);
  const defaultTab = isTerceirizado ? 'evolutions' : (tab && availableTabs.includes(tab) ? tab : 'prescription');

  return (
    <Layout title={`Prontuário - ${resident.name}`} showBackButton={true} residentForReport={resident}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader><CardTitle className="text-foreground flex items-center"><User className="h-6 w-6 mr-2" />Informações do Residente</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><h3 className="text-lg font-semibold text-foreground">{resident.name}</h3><p className="text-muted-foreground">CPF: {formatCPF(resident.cpf)}</p><div className="flex items-center text-muted-foreground mt-2"><Phone className="h-4 w-4 mr-2" />{formatPhone(resident.phone)}</div></div>
              <div><h4 className="font-medium text-foreground">Responsável</h4><p className="text-muted-foreground">{resident.responsible_name}</p><div className="flex items-center text-muted-foreground mt-2"><Phone className="h-4 w-4 mr-2" />{formatPhone(resident.responsible_phone)}</div></div>
              <div><h4 className="font-medium text-foreground flex items-center"><Stethoscope className="h-4 w-4 mr-2" />Médicos</h4><p className="text-muted-foreground text-sm">Casa: {resident.home_doctor || 'N/A'}</p><p className="text-muted-foreground text-sm">Residente: {resident.resident_doctor || 'N/A'}</p></div>
              <div className="lg:col-span-3"><h4 className="font-medium text-foreground">Diagnóstico</h4><p className="text-muted-foreground text-sm">{resident.diagnosis || 'Nenhum diagnóstico informado.'}</p></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Grades: <span className={`font-semibold ${resident.has_grades ? 'text-green-600' : 'text-red-600'}`}>{resident.has_grades ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Cinto de Segurança: <span className={`font-semibold ${resident.has_seatbelt ? 'text-green-600' : 'text-red-600'}`}>{resident.has_seatbelt ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><Bed className="h-4 w-4" />Colchão de Ar: <span className={`font-semibold ${resident.has_air_mattress ? 'text-green-600' : 'text-red-600'}`}>{resident.has_air_mattress ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Escala MORSE: <span className="font-semibold">{resident.morse_scale || 'N/A'}</span></div>
              <div className="flex items-center gap-2"><FileHeart className="h-4 w-4" />Escala BRADEN: <span className="font-semibold">{resident.braden_scale || 'N/A'}</span></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Tabs value={defaultTab} onValueChange={(value) => navigate(`/residente/${id}/${value}`, { replace: true })} className="w-full">
            <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
              {orderedTabList.map(({ value, label, icon: Icon, available }) => {
                if (!available) return null;
                return <TabsTrigger key={value} value={value}><Icon className="h-4 w-4 mr-2" />{label}</TabsTrigger>
              })}
            </TabsList>
            <TabsContent value="prescription" className="mt-6"><PrescriptionTab residentId={resident.id} /></TabsContent>
            <TabsContent value="nursing" className="mt-6"><NursingCareTab residentId={resident.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="basic" className="mt-6"><BasicCareTab residentId={resident.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="vitals" className="mt-6"><VitalSignsTab residentId={resident.id} residentName={resident.name} canEdit={canEdit} /></TabsContent>
            <TabsContent value="evolutions" className="mt-6"><EvolutionTab residentId={resident.id} /></TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
