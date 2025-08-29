import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, ArrowLeft, Bell, FileDown, BookOpen } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exportToPDF, exportToExcel } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const logoUrl = "https://horizons-cdn.hostinger.com/7e24448c-0ef4-47ce-900b-32a45ba8b28c/51ce87665d4b734d49614b775b3ba37d.jpg";

export default function Layout({ children, title, showBackButton = false, residentForReport = null }) {
  const { user, signOut } = useAuth();
  const { alerts, markAlertAsRead, residents, prescriptions, nursingCare, basicCare, vitalSigns, medicationStock, evolutions } = useData();
  const navigate = useNavigate();
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    prescription: false, nursing: false, basic: false, vitals: false, all: false
  });

  const userName = user?.user_metadata?.name || user?.email;
  const userRole = user?.user_metadata?.role || user?.role;
  const unreadAlerts = alerts.filter(a => !a.read);
  const vitalAlertsForSupervisor = alerts.filter(a => a.type === 'vital' && !a.read);

  useEffect(() => {
    if ((userRole === 'supervisor' || userRole === 'administrador') && vitalAlertsForSupervisor.length > 0) {
      setCurrentAlert(vitalAlertsForSupervisor[0]);
      setShowAlertDialog(true);
    }
  }, [userRole, alerts]);

  const handleAlertConfirm = () => {
    if (currentAlert) {
      markAlertAsRead(currentAlert.id);
      if (currentAlert.residentId) {
        navigate(`/residente/${currentAlert.residentId}`);
      }
    }
    setShowAlertDialog(false);
    setCurrentAlert(null);
  };

  const handleExport = (format) => {
    if (Object.values(exportOptions).every(v => v === false)) {
      toast({ title: 'Atenção', description: 'Selecione pelo menos um item para exportar.', variant: 'destructive' });
      return;
    }

    const { residentId, name } = residentForReport;
    const dataToExport = [];
    
    if (exportOptions.prescription || exportOptions.all) {
      dataToExport.push({ title: 'Prescrição Médica', data: prescriptions.filter(d => d.residentId === residentId) });
    }
    if (exportOptions.nursing || exportOptions.all) {
        dataToExport.push({ title: 'Cuidados de Enfermagem', data: nursingCare.filter(d => d.residentId === residentId) });
    }
    if (exportOptions.basic || exportOptions.all) {
        dataToExport.push({ title: 'Controle Básico', data: basicCare.filter(d => d.residentId === residentId) });
    }
    if (exportOptions.vitals || exportOptions.all) {
        dataToExport.push({ title: 'Sinais Vitais', data: vitalSigns.filter(d => d.residentId === residentId) });
    }

    const filename = `prontuario_${name.replace(/\s+/g, '_').toLowerCase()}`;
    if (format === 'pdf') {
      const docData = dataToExport.map(section => ({
        title: section.title,
        headers: Object.keys(section.data[0] || {}),
        rows: section.data.map(row => Object.values(row))
      }));
       exportToPDF(`Prontuário - ${name}`, docData, true);
    } else {
       exportToExcel(dataToExport, filename);
    }
    setIsExportDialogOpen(false);
  };

  const handleAllCheckbox = (checked) => {
    setExportOptions({ prescription: checked, nursing: checked, basic: checked, vitals: checked, all: checked });
  };


  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card shadow-sm z-10">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
                 <img src={logoUrl} alt="Arte e Cuidar Logo" className="h-16" />
              </motion.div>
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {userRole === 'administrador' && residentForReport && (
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><FileDown className="h-4 w-4 mr-2" />Exportar Prontuário</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Exportar Prontuário de {residentForReport.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2"><Checkbox id="all" checked={exportOptions.all} onCheckedChange={handleAllCheckbox} /><Label htmlFor="all">Todos os itens</Label></div>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                            <div className="flex items-center space-x-2"><Checkbox id="prescription" checked={exportOptions.prescription} onCheckedChange={(c) => setExportOptions({...exportOptions, prescription: c, all: false})}/><Label htmlFor="prescription">Prescrição Médica</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="nursing" checked={exportOptions.nursing} onCheckedChange={(c) => setExportOptions({...exportOptions, nursing: c, all: false})} /><Label htmlFor="nursing">Cuidados de Enfermagem</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="basic" checked={exportOptions.basic} onCheckedChange={(c) => setExportOptions({...exportOptions, basic: c, all: false})} /><Label htmlFor="basic">Controle Básico</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="vitals" checked={exportOptions.vitals} onCheckedChange={(c) => setExportOptions({...exportOptions, vitals: c, all: false})} /><Label htmlFor="vitals">Sinais Vitais</Label></div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => handleExport('pdf')}>PDF</Button>
                            <Button onClick={() => handleExport('excel')}>Excel</Button>
                        </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                {unreadAlerts.length > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>}
              </Button>
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F5F7FA]">
          <div className="container mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-6">{title}</h1>
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Alerta de Sinais Vitais!</AlertDialogTitle>
            <AlertDialogDescription>
              Houve uma alteração importante no sinal vital do(a) residente <span className="font-bold">{residents.find(p => p.id === currentAlert?.residentId)?.name}</span>:
              <p className="font-semibold mt-2">{currentAlert?.message}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertConfirm}>Ir para o prontuário</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}