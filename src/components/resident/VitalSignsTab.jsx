
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Activity, Calendar, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const initialFormData = { systolic_pressure: '', diastolic_pressure: '', heart_rate: '', respiratory_rate: '', temperature: '', oxygen_saturation: '', glycemia: '', pain: '' };

export default function VitalSignsTab({ residentId, residentName, canEdit }) {
  const { vitalSigns, addOrUpdateVitalSigns, addAlert } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessages, setAlertMessages] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const residentVitalSigns = vitalSigns.filter(v => v.resident_id === residentId);
  
  const [editingSign, setEditingSign] = useState(null);

  useEffect(() => {
    if (editingSign) {
      setFormData({
        systolic_pressure: editingSign.systolic_pressure || '', diastolic_pressure: editingSign.diastolic_pressure || '',
        heart_rate: editingSign.heart_rate || '', respiratory_rate: editingSign.respiratory_rate || '',
        temperature: editingSign.temperature || '', oxygen_saturation: editingSign.oxygen_saturation || '',
        glycemia: editingSign.glycemia || '', pain: editingSign.pain || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingSign]);

  const checkVitalSigns = (signs) => {
    const alerts = [];
    if (signs.systolic_pressure > 150) alerts.push(`Pressão Sistólica alta: ${signs.systolic_pressure} mmHg`);
    if (signs.systolic_pressure < 90) alerts.push(`Pressão Sistólica baixa: ${signs.systolic_pressure} mmHg`);
    if (signs.diastolic_pressure > 100) alerts.push(`Pressão Diastólica alta: ${signs.diastolic_pressure} mmHg`);
    if (signs.diastolic_pressure < 40) alerts.push(`Pressão Diastólica baixa: ${signs.diastolic_pressure} mmHg`);
    if (signs.temperature > 37) alerts.push(`Temperatura alta: ${signs.temperature}°C`);
    if (signs.heart_rate > 100) alerts.push(`Frequência Cardíaca alta: ${signs.heart_rate} bpm`);
    if (signs.respiratory_rate > 25) alerts.push(`Frequência Respiratória alta: ${signs.respiratory_rate} rpm`);
    if (signs.oxygen_saturation < 92) alerts.push(`Saturação baixa: ${signs.oxygen_saturation}%`);
    if (signs.glycemia > 120) alerts.push(`Glicemia alta: ${signs.glycemia} mg/dL`);
    if (signs.pain && signs.pain.trim() !== '') alerts.push(`Relato de Dor: ${signs.pain}`);
    return alerts;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const requiredFields = { ...formData };
    delete requiredFields.pain;

    if (Object.values(requiredFields).some(value => value === '')) {
      toast({ title: "Erro", description: "Preencha todos os campos, exceto a dor que é opcional.", variant: "destructive" });
      return;
    }

    const signs = {
      resident_id: residentId, caregiver_name: user?.profile?.name,
      systolic_pressure: parseInt(formData.systolic_pressure), diastolic_pressure: parseInt(formData.diastolic_pressure),
      heart_rate: parseInt(formData.heart_rate), respiratory_rate: parseInt(formData.respiratory_rate),
      temperature: parseFloat(formData.temperature), oxygen_saturation: parseInt(formData.oxygen_saturation),
      glycemia: parseInt(formData.glycemia), pain: formData.pain,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newSign = addOrUpdateVitalSigns(editingSign ? editingSign.id : null, signs);
    toast({ title: "Sucesso!", description: `Sinais vitais ${editingSign ? 'atualizados' : 'registrados'}.` });
    setIsDialogOpen(false);
    setEditingSign(null);

    const alerts = checkVitalSigns(newSign);
    if (alerts.length > 0) {
      setAlertMessages(alerts);
      setIsAlertOpen(true);
      alerts.forEach(msg => addAlert({ type: 'vital', message: msg, resident_id: residentId }));
    }
  };

  const getVitalStatus = (type, v1, v2) => {
    if (v1 === null || v1 === undefined) return 'text-foreground';
    const conditions = {
      pressure: v1 > 150 || v1 < 90 || v2 > 100 || v2 < 40, heart_rate: v1 > 100,
      respiratory_rate: v1 > 25, temperature: v1 > 37, oxygen_saturation: v1 < 92, glycemia: v1 > 120, 
      pain: typeof v1 === 'string' && v1.trim() !== ''
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
                <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) setEditingSign(null); }}>
                  <DialogTrigger asChild><Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"><Plus className="h-4 w-4 mr-2" />Registrar Sinais</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingSign ? 'Editar' : 'Registrar'} Sinais Vitais</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Pressão Sistólica (mmHg)</Label><Input type="number" placeholder="ex: 120" value={formData.systolic_pressure} onChange={(e) => setFormData({...formData, systolic_pressure: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Pressão Diastólica (mmHg)</Label><Input type="number" placeholder="ex: 80" value={formData.diastolic_pressure} onChange={(e) => setFormData({...formData, diastolic_pressure: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Frequência Cardíaca (bpm)</Label><Input type="number" placeholder="ex: 75" value={formData.heart_rate} onChange={(e) => setFormData({...formData, heart_rate: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Frequência Respiratória (rpm)</Label><Input type="number" placeholder="ex: 16" value={formData.respiratory_rate} onChange={(e) => setFormData({...formData, respiratory_rate: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Temperatura (°C)</Label><Input type="number" step="0.1" placeholder="ex: 36.5" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Saturação de O₂ (%)</Label><Input type="number" placeholder="ex: 98" value={formData.oxygen_saturation} onChange={(e) => setFormData({...formData, oxygen_saturation: e.target.value})} /></div>
                        <div className="space-y-2 col-span-2 md:col-span-1"><Label>Glicemia (mg/dL)</Label><Input type="number" placeholder="ex: 99" value={formData.glycemia} onChange={(e) => setFormData({...formData, glycemia: e.target.value})} /></div>
                      </div>
                      <div className="space-y-2"><Label>Relato de Dor (Opcional)</Label><Textarea placeholder="Descreva a dor do residente" value={formData.pain} onChange={(e) => setFormData({...formData, pain: e.target.value})} /></div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1">{editingSign ? 'Atualizar' : 'Registrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="space-y-4">
        {residentVitalSigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Card className={checkVitalSigns(s).length > 0 ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-foreground flex items-center text-lg"><Calendar className="h-5 w-5 mr-2" />{new Date(s.created_at).toLocaleDateString('pt-BR')} - {s.time}</CardTitle>
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => { setEditingSign(s); setIsDialogOpen(true);}}><Edit className="h-4 w-4" /></Button>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><Label>Pressão Arterial</Label><p className={getVitalStatus('pressure', s.systolic_pressure, s.diastolic_pressure)}>{s.systolic_pressure}/{s.diastolic_pressure} mmHg</p></div>
                  <div><Label>Freq. Cardíaca</Label><p className={getVitalStatus('heart_rate', s.heart_rate)}>{s.heart_rate} bpm</p></div>
                  <div><Label>Freq. Respiratória</Label><p className={getVitalStatus('respiratory_rate', s.respiratory_rate)}>{s.respiratory_rate} rpm</p></div>
                  <div><Label>Temperatura</Label><p className={getVitalStatus('temperature', s.temperature)}>{`${(s.temperature || 0).toFixed(1)}°C`}</p></div>
                  <div><Label>Saturação O₂</Label><p className={getVitalStatus('oxygen_saturation', s.oxygen_saturation)}>{s.oxygen_saturation}%</p></div>
                  <div><Label>Glicemia</Label><p className={getVitalStatus('glycemia', s.glycemia)}>{s.glycemia} mg/dL</p></div>
                </div>
                <div><Label>Relato de Dor</Label><p className={getVitalStatus('pain', s.pain)}>{s.pain || 'Nenhum relato'}</p></div>
                <p className="text-xs text-muted-foreground mt-4">Registrado por: {s.caregiver_name}</p>
                {s.updated_at && <p className="text-xs text-muted-foreground">Atualizado em: {new Date(s.updated_at).toLocaleString('pt-BR')}</p>}
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
              Os seguintes sinais vitais estão fora do normal para {residentName}:
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
