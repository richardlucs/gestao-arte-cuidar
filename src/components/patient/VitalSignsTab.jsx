import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Activity, Calendar, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const initialFormData = { systolicPressure: '', diastolicPressure: '', heartRate: '', respiratoryRate: '', temperature: '', oxygenSaturation: '', glycemia: '', pain: '' };

export default function VitalSignsTab({ patientId, patientName, canEdit }) {
  const { vitalSigns, addOrUpdateVitalSigns, addAlert } = useData();
  const { user, displayName } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessages, setAlertMessages] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const patientVitalSigns = vitalSigns.filter(v => v.patientId === patientId);
  const today = new Date().toISOString().split('T')[0];
  const todaysSign = patientVitalSigns.find(v => v.date === today);

  useEffect(() => {
    if (todaysSign) {
      setFormData({
        systolicPressure: todaysSign.systolicPressure || '', diastolicPressure: todaysSign.diastolicPressure || '',
        heartRate: todaysSign.heartRate || '', respiratoryRate: todaysSign.respiratoryRate || '',
        temperature: todaysSign.temperature || '', oxygenSaturation: todaysSign.oxygenSaturation || '',
        glycemia: todaysSign.glycemia || '', pain: todaysSign.pain || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [todaysSign]);

  const checkVitalSigns = (signs) => {
    const alerts = [];
    if (signs.systolicPressure > 150) alerts.push(`Pressão Sistólica alta: ${signs.systolicPressure} mmHg`);
    if (signs.systolicPressure < 90) alerts.push(`Pressão Sistólica baixa: ${signs.systolicPressure} mmHg`);
    if (signs.diastolicPressure > 100) alerts.push(`Pressão Diastólica alta: ${signs.diastolicPressure} mmHg`);
    if (signs.diastolicPressure < 40) alerts.push(`Pressão Diastólica baixa: ${signs.diastolicPressure} mmHg`);
    if (signs.temperature > 37) alerts.push(`Temperatura alta: ${signs.temperature}°C`);
    if (signs.heartRate > 100) alerts.push(`Frequência Cardíaca alta: ${signs.heartRate} bpm`);
    if (signs.respiratoryRate > 25) alerts.push(`Frequência Respiratória alta: ${signs.respiratoryRate} rpm`);
    if (signs.oxygenSaturation < 92) alerts.push(`Saturação baixa: ${signs.oxygenSaturation}%`);
    if (signs.glycemia > 120) alerts.push(`Glicemia alta: ${signs.glycemia} mg/dL`);
    return alerts;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = { ...initialFormData };
    delete requiredFields.pain;

    if (Object.keys(requiredFields).some(key => formData[key] === '')) {
      toast({ title: "Erro", description: "Preencha todos os campos, exceto a dor que é opcional.", variant: "destructive" });
      return;
    }

    const signs = {
      patientId, caregiverName: displayName,
      systolicPressure: parseInt(formData.systolicPressure), diastolicPressure: parseInt(formData.diastolicPressure),
      heartRate: parseInt(formData.heartRate), respiratoryRate: parseInt(formData.respiratoryRate),
      temperature: parseFloat(formData.temperature), oxygenSaturation: parseInt(formData.oxygenSaturation),
      glycemia: parseInt(formData.glycemia), pain: formData.pain
    };

    const newSign = addOrUpdateVitalSigns(signs);
    toast({ title: "Sucesso!", description: `Sinais vitais ${todaysSign ? 'atualizados' : 'registrados'}.` });
    setIsDialogOpen(false);

    const alerts = checkVitalSigns(newSign);
    if (alerts.length > 0) {
      setAlertMessages(alerts);
      setIsAlertOpen(true);
      alerts.forEach(msg => addAlert({ type: 'vital', message: msg, patientId }));
    }
  };

  const getVitalStatus = (type, v1, v2) => {
    const conditions = {
      pressure: v1 > 150 || v1 < 90 || v2 > 100 || v2 < 40, heartRate: v1 > 100,
      respiratoryRate: v1 > 25, temperature: v1 > 37, oxygenSaturation: v1 < 92, glycemia: v1 > 120
    };
    return conditions[type] ? 'text-red-500 font-bold' : 'text-foreground';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center"><Activity className="h-6 w-6 mr-2" />Sinais Vitais</CardTitle>
              {canEdit && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild><Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{todaysSign ? <><Edit className="h-4 w-4 mr-2" />Editar Registro</> : <><Plus className="h-4 w-4 mr-2" />Registrar Sinais</>}</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{todaysSign ? 'Editar' : 'Registrar'} Sinais Vitais</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Pressão Sistólica (mmHg)</Label><Input type="number" placeholder="ex: 120" value={formData.systolicPressure} onChange={(e) => setFormData({...formData, systolicPressure: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Pressão Diastólica (mmHg)</Label><Input type="number" placeholder="ex: 80" value={formData.diastolicPressure} onChange={(e) => setFormData({...formData, diastolicPressure: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Frequência Cardíaca (bpm)</Label><Input type="number" placeholder="ex: 75" value={formData.heartRate} onChange={(e) => setFormData({...formData, heartRate: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Frequência Respiratória (rpm)</Label><Input type="number" placeholder="ex: 16" value={formData.respiratoryRate} onChange={(e) => setFormData({...formData, respiratoryRate: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Temperatura (°C)</Label><Input type="number" step="0.1" placeholder="ex: 36.5" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Saturação de O₂ (%)</Label><Input type="number" placeholder="ex: 98" value={formData.oxygenSaturation} onChange={(e) => setFormData({...formData, oxygenSaturation: e.target.value})} /></div>
                        <div className="space-y-2 col-span-2 md:col-span-1"><Label>Glicemia (mg/dL)</Label><Input type="number" placeholder="ex: 99" value={formData.glycemia} onChange={(e) => setFormData({...formData, glycemia: e.target.value})} /></div>
                      </div>
                      <div className="space-y-2"><Label>Relato de Dor (Opcional)</Label><Textarea placeholder="Descreva a dor do paciente" value={formData.pain} onChange={(e) => setFormData({...formData, pain: e.target.value})} /></div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1">{todaysSign ? 'Atualizar' : 'Registrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="space-y-4">
        {patientVitalSigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Card className={checkVitalSigns(s).length > 0 ? 'border-red-500' : ''}>
              <CardHeader><CardTitle className="text-foreground flex items-center text-lg"><Calendar className="h-5 w-5 mr-2" />{new Date(s.createdAt).toLocaleDateString('pt-BR')} - {s.time}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><Label>Pressão Arterial</Label><p className={getVitalStatus('pressure', s.systolicPressure, s.diastolicPressure)}>{s.systolicPressure}/{s.diastolicPressure} mmHg</p></div>
                  <div><Label>Freq. Cardíaca</Label><p className={getVitalStatus('heartRate', s.heartRate)}>{s.heartRate} bpm</p></div>
                  <div><Label>Freq. Respiratória</Label><p className={getVitalStatus('respiratoryRate', s.respiratoryRate)}>{s.respiratoryRate} rpm</p></div>
                  <div><Label>Temperatura</Label><p className={getVitalStatus('temperature', s.temperature)}>{s.temperature.toFixed(1)}°C</p></div>
                  <div><Label>Saturação O₂</Label><p className={getVitalStatus('oxygenSaturation', s.oxygenSaturation)}>{s.oxygenSaturation}%</p></div>
                  <div><Label>Glicemia</Label><p className={getVitalStatus('glycemia', s.glycemia)}>{s.glycemia} mg/dL</p></div>
                </div>
                <div><Label>Relato de Dor</Label><p className="text-muted-foreground">{s.pain || 'Nenhum relato'}</p></div>
                <p className="text-xs text-muted-foreground mt-4">Registrado por: {s.caregiverName}</p>
                {s.updatedAt && <p className="text-xs text-muted-foreground">Atualizado em: {new Date(s.updatedAt).toLocaleString('pt-BR')}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Alerta de Sinais Vitais!</AlertDialogTitle>
            <AlertDialogDescription>
              Os seguintes sinais vitais estão fora do normal para {patientName}:
              <ul className="list-disc pl-5 mt-2">{alertMessages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
              <strong className="mt-4 block">Por favor, comunique a supervisão imediatamente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setIsAlertOpen(false)}>Entendido</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}