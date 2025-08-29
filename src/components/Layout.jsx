import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, ArrowLeft, Bell, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exportToPDF, exportToExcel } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const logoUrl = "https://horizons-cdn.hostinger.com/7e24448c-0ef4-47ce-900b-32a45ba8b28c/51ce87665d4b734d49614b775b3ba37d.jpg";

export default function Layout({ children, title, showBackButton = false, residentForReport }) {
  const { user, signOut } = useAuth();
  const { alerts, markAlertAsRead, residents, prescriptions, nursingCare, basicCare, vitalSigns, evolutions, medicationStock } = useData();
  const navigate = useNavigate();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportOption, setExportOption] = useState('');
  
  const userRole = user?.profile?.role;
  const userName = user?.profile?.name || user?.email;

  const userAlerts = alerts.filter(a => !a.read && (a.type === 'stock' || a.type === 'vital'));

  useEffect(() => {
    if (userRole === 'supervisor' || userRole === 'administrador') {
      const unreadAlert = userAlerts.find(a => !a.read);
      if (unreadAlert) {
        setCurrentAlert(unreadAlert);
        setIsAlertsOpen(true);
      }
    }
  }, [alerts, userRole]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const getRoleDisplay = (role) => {
    const roles = {
      cuidador: 'Cuidador',
      supervisor: 'Supervisor',
      administrador: 'Administrador',
      medico_geriatra: 'Médico Geriatra',
      terceirizado: 'Terceirizado'
    };
    return roles[role] || role;
  };

  const handleAlertClose = () => {
    if (currentAlert) {
      markAlertAsRead(currentAlert.id);
    }
    setIsAlertsOpen(false);
    setCurrentAlert(null);
  };

  const getResidentName = (residentId) => {
    const resident = residents.find(p => p.id === residentId);
    return resident ? resident.name : 'Residente desconhecido';
  };
  
  const getDaysInCurrentMonth = () => {
      const date = new Date();
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  const currentMonthDays = Array.from({ length: getDaysInCurrentMonth() }, (_, i) => i + 1);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const handleExport = (format) => {
    if (!residentForReport || !exportOption) {
      toast({ title: 'Atenção', description: 'Selecione um item para exportar.', variant: 'destructive' });
      return;
    }

    const { id: residentId, name } = residentForReport;
    let dataToExport = [];
    let headers = [];
    let sectionTitle = '';
    const filename = `prontuario_${name.replace(/\s+/g, '_').toLowerCase()}_${exportOption}`;

    switch (exportOption) {
      case 'evolutions':
        sectionTitle = 'Evoluções';
        headers = ['Data', 'Evolução', 'Profissional'];
        dataToExport = evolutions.filter(d => d.resident_id === residentId).map(e => ({
          'Data': new Date(e.created_at).toLocaleString('pt-BR'),
          'Evolução': e.content,
          'Profissional': `${e.user_name} (${e.user_role})`
        }));
        break;
      case 'prescriptions':
        sectionTitle = 'Prescrição Médica';
        headers = ['Data', 'Medicamento', 'Dosagem', 'Horário', 'Status', 'Responsável'];
        const residentPrescription = prescriptions.find(p => p.resident_id === residentId);
        if (residentPrescription && residentPrescription.daily_records) {
           Object.entries(residentPrescription.daily_records).forEach(([date, records]) => {
              Object.entries(records).forEach(([itemId, record]) => {
                 const item = residentPrescription.items.find(i => i.id === itemId);
                 if (item) {
                     const medInfo = medicationStock.find(m => m.id === item.medicationId);
                     dataToExport.push({
                         'Data': new Date(date).toLocaleDateString('pt-BR'),
                         'Medicamento': medInfo?.nome_medicamento || 'N/A',
                         'Dosagem': item.dosage,
                         'Horário': item.time,
                         'Status': record.completed ? 'Realizado' : 'Não Realizado',
                         'Responsável': record.completedBy || 'N/A'
                     });
                 }
              });
           });
        }
        break;
      case 'nursing':
          sectionTitle = 'Cuidados de Enfermagem';
          const residentNursingCare = nursingCare.filter(c => c.resident_id === residentId);
          headers = ['Cuidado', ...currentMonthDays.map(day => `${day}`)];
          dataToExport = residentNursingCare.map(care => {
              const row = { 'Cuidado': care.procedure };
              currentMonthDays.forEach(day => {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = care.daily_records?.[dateStr];
                  let dayStatus = '';
                  if (record) {
                    if (record.morning?.completed) dayStatus += 'M ';
                    if (record.afternoon?.completed) dayStatus += 'T ';
                    if (record.night?.completed) dayStatus += 'N';
                  }
                  row[day] = dayStatus.trim() || '-';
              });
              return row;
          });
          break;
      case 'basic':
          sectionTitle = 'Controle Básico';
          const residentBasicCare = basicCare.filter(c => c.resident_id === residentId);
          headers = ['Data', 'Evacuação', 'Obs. Evacuação', 'Banho', 'Obs. Banho', 'Alimentação', 'Obs. Alimentação', 'Responsável'];
          dataToExport = residentBasicCare.map(care => ({
              'Data': new Date(care.date).toLocaleDateString('pt-BR'),
              'Evacuação': care.evacuation ? `Tipo ${care.evacuation}` : 'Não',
              'Obs. Evacuação': care.evacuation_notes || '-',
              'Banho': care.bath ? 'Sim' : 'Não',
              'Obs. Banho': care.bath_notes || '-',
              'Alimentação': care.feeding ? 'Sim' : 'Não',
              'Obs. Alimentação': care.feeding_notes || '-',
              'Responsável': care.created_by || care.updated_by || 'N/A',
          }));
          break;
      case 'vitals':
          sectionTitle = 'Sinais Vitais';
          const residentVitalSigns = vitalSigns.filter(vs => vs.resident_id === residentId);
          headers = ['Data/Hora', 'Pressão Arterial', 'FC', 'FR', 'Temp', 'Sat O₂', 'Glicemia', 'Dor', 'Responsável'];
          dataToExport = residentVitalSigns.map(s => ({
              'Data/Hora': `${new Date(s.created_at).toLocaleDateString('pt-BR')} ${s.time}`,
              'Pressão Arterial': `${s.systolic_pressure}/${s.diastolic_pressure}`,
              'FC': s.heart_rate,
              'FR': s.respiratory_rate,
              'Temp': `${(s.temperature || 0).toFixed(1)}°C`,
              'Sat O₂': `${s.oxygen_saturation}%`,
              'Glicemia': s.glycemia,
              'Dor': s.pain || 'N/A',
              'Responsável': s.caregiver_name,
          }));
          break;
      default:
        toast({ title: 'Erro', description: 'Opção de exportação inválida.', variant: 'destructive' });
        return;
    }
    
    const sections = [{ title: sectionTitle, data: dataToExport, headers }];

    if (format === 'pdf') {
      exportToPDF(`Prontuário ${name} - ${sectionTitle}`, sections);
    } else {
      exportToExcel(sections, filename);
    }
    setIsExportOpen(false);
    setExportOption('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.div className="flex items-center space-x-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <img src={logoUrl} alt="Arte e Cuidar Logo" className="h-12"/>
            </motion.div>
            <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center space-x-2 text-foreground">
                <User className="h-4 w-4" />
                <div className="text-right">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{getRoleDisplay(userRole)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div className="mb-8 flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="flex items-center gap-4">
            {showBackButton && (<Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>)}
            {title && (<h2 className="text-3xl font-bold text-foreground">{title}</h2>)}
          </div>
          {userRole === 'administrador' && residentForReport && (
            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
              <DialogTrigger asChild><Button><FileDown className="mr-2 h-4 w-4" />Exportar Relatório</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Exportar Relatório de {residentForReport.name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <p>Selecione o item para incluir no relatório:</p>
                  <RadioGroup value={exportOption} onValueChange={setExportOption} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="prescriptions" id="exp_presc" /><Label htmlFor="exp_presc">Prescrição Médica</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="nursing" id="exp_nurs" /><Label htmlFor="exp_nurs">Cuidados de Enfermagem</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="basic" id="exp_basic" /><Label htmlFor="exp_basic">Controle Básico</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="vitals" id="exp_vitals" /><Label htmlFor="exp_vitals">Sinais Vitais</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="evolutions" id="exp_evo" /><Label htmlFor="exp_evo">Evoluções</Label></div>
                  </RadioGroup>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!exportOption}>Exportar PDF</Button>
                  <Button onClick={() => handleExport('excel')} disabled={!exportOption}>Exportar Excel</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          {children}
        </motion.div>
      </main>

      <AlertDialog open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive"><Bell className="mr-2 h-6 w-6" /> Alerta Importante!</AlertDialogTitle>
            <AlertDialogDescription>
              {currentAlert?.type === 'vital' && `O residente ${getResidentName(currentAlert.resident_id)} apresentou uma alteração crítica: ${currentAlert.message}.`}
              {currentAlert?.type === 'stock' && `Alerta de estoque: ${currentAlert.message}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {currentAlert?.type === 'vital' && (<Button onClick={() => { navigate(`/residente/${currentAlert.resident_id}`); handleAlertClose(); }}>Ver Prontuário</Button>)}
            <AlertDialogAction onClick={handleAlertClose}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}