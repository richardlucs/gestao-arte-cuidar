import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrescriptionTab from '@/components/patient/PrescriptionTab';
import NursingCareTab from '@/components/patient/NursingCareTab';
import BasicCareTab from '@/components/patient/BasicCareTab';
import VitalSignsTab from '@/components/patient/VitalSignsTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, FileText, Heart, Users, Activity, Stethoscope, ShieldCheck, Bed, ClipboardList, FileHeart } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';

export default function PatientDetail() {
  const { id } = useParams();
  const { patients } = useData();
  const { user, displayName } = useAuth();
  
  const [activeTab, setActiveTab] = useState('prescription');

  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return (
      <Layout title="Paciente não encontrado" showBackButton={true}>
        <Card><CardContent className="text-center py-12"><User className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Paciente não encontrado</h3><p className="text-muted-foreground">O paciente solicitado não existe ou foi removido.</p></CardContent></Card>
      </Layout>
    );
  }

  const canEdit = ['supervisor', 'administrador'].includes(user?.role);

  return (
    <Layout title={`Prontuário - ${patient.name}`} showBackButton={true} patientForReport={patient}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader><CardTitle className="text-foreground flex items-center"><User className="h-6 w-6 mr-2" />Informações do Paciente</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><h3 className="text-lg font-semibold text-foreground">{patient.name}</h3><p className="text-muted-foreground">CPF: {formatCPF(patient.cpf)}</p><div className="flex items-center text-muted-foreground mt-2"><Phone className="h-4 w-4 mr-2" />{formatPhone(patient.phone)}</div></div>
              <div><h4 className="font-medium text-foreground">Responsável</h4><p className="text-muted-foreground">{patient.responsibleName}</p><div className="flex items-center text-muted-foreground mt-2"><Phone className="h-4 w-4 mr-2" />{formatPhone(patient.responsiblePhone)}</div></div>
              <div><h4 className="font-medium text-foreground flex items-center"><Stethoscope className="h-4 w-4 mr-2" />Médicos</h4><p className="text-muted-foreground text-sm">Casa: {patient.homeDoctor || 'N/A'}</p><p className="text-muted-foreground text-sm">Paciente: {patient.patientDoctor || 'N/A'}</p></div>
              <div className="lg:col-span-3"><h4 className="font-medium text-foreground">Diagnóstico</h4><p className="text-muted-foreground text-sm">{patient.diagnosis || 'Nenhum diagnóstico informado.'}</p></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Grades: <span className={`font-semibold ${patient.hasGrades === 'sim' ? 'text-green-600' : 'text-red-600'}`}>{patient.hasGrades === 'sim' ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Cinto de Segurança: <span className={`font-semibold ${patient.hasSeatbelt === 'sim' ? 'text-green-600' : 'text-red-600'}`}>{patient.hasSeatbelt === 'sim' ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><Bed className="h-4 w-4" />Colchão de Ar: <span className={`font-semibold ${patient.hasAirMattress === 'sim' ? 'text-green-600' : 'text-red-600'}`}>{patient.hasAirMattress === 'sim' ? 'Sim' : 'Não'}</span></div>
              <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Escala MORSE: <span className="font-semibold">{patient.morseScale || 'N/A'}</span></div>
              <div className="flex items-center gap-2"><FileHeart className="h-4 w-4" />Escala BRADEN: <span className="font-semibold">{patient.bradenScale || 'N/A'}</span></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prescription"><FileText className="h-4 w-4 mr-2" />Prescrição Médica</TabsTrigger>
              <TabsTrigger value="nursing"><Heart className="h-4 w-4 mr-2" />Cuidados de Enfermagem</TabsTrigger>
              <TabsTrigger value="basic"><Users className="h-4 w-4 mr-2" />Controle Básico</TabsTrigger>
              <TabsTrigger value="vitals"><Activity className="h-4 w-4 mr-2" />Sinais Vitais</TabsTrigger>
            </TabsList>
            <TabsContent value="prescription" className="mt-6"><PrescriptionTab patientId={patient.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="nursing" className="mt-6"><NursingCareTab patientId={patient.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="basic" className="mt-6"><BasicCareTab patientId={patient.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="vitals" className="mt-6"><VitalSignsTab patientId={patient.id} patientName={patient.name} canEdit={canEdit} /></TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}