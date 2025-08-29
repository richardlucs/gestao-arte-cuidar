import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const initialFormData = {
  medicationId: '', dosage: '', time: '', instructions: '',
  frequencyType: 'hours', frequencyValue: '', weekdays: [], monthday: ''
};
const weekdaysOptions = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function PrescriptionTab({ patientId, canEdit }) {
  const { prescriptions, addPrescription, updatePrescriptionItem, medicationStock, updateMedicationStock: moveStock, addAlert } = useData();
  const { user, displayName } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedMed, setSelectedMed] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId && p.recurring);

  useEffect(() => {
    if (formData.medicationId) {
      const med = medicationStock.find(m => m.id === formData.medicationId);
      setSelectedMed(med);
    } else {
      setSelectedMed(null);
    }
  }, [formData.medicationId, medicationStock]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.medicationId || !formData.dosage || !formData.time || !formData.frequencyType) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    const medication = medicationStock.find(m => m.id === formData.medicationId);
    addPrescription({ patientId, medicationName: medication.commercialName, ...formData, createdBy: displayName, createdAt: new Date().toISOString() });
    toast({ title: "Sucesso!", description: "Prescrição adicionada." });
    setFormData(initialFormData);
    setIsDialogOpen(false);
  };

  const handleItemCheck = (prescription, checked) => {
    updatePrescriptionItem(patientId, prescription.id, prescription.id, today, checked);
    const medInStock = medicationStock.find(m => m.id === prescription.medicationId);
    if (medInStock) {
      const amount = checked ? -1 : 1;
      moveStock(medInStock.id, { amount, reason: `Administração ${checked ? '' : 'revertida'} - ${prescription.medicationName}`, user: displayName });
      const newQuantity = (medInStock.quantity || 0) + amount;
      if (newQuantity < parseInt(medInStock.minStock)) {
        addAlert({ type: 'stock', message: `Estoque baixo para ${medInStock.commercialName}. Quantidade atual: ${newQuantity}.` });
      }
    }
    toast({ title: checked ? "Item confirmado!" : "Confirmação removida" });
  };

  const getDailyStatus = (prescription) => prescription.dailyRecords?.[today]?.[prescription.id]?.completed || false;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center"><FileText className="h-6 w-6 mr-2" />Prescrições Médicas de Hoje</CardTitle>
              {canEdit && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="bg-purple-500 hover:bg-purple-600 text-white"><Plus className="h-4 w-4 mr-2" />Nova Prescrição</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Adicionar Prescrição Médica</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2"><Label>Medicamento *</Label>
                        <Select onValueChange={(v) => setFormData({...formData, medicationId: v})}><SelectTrigger><SelectValue placeholder="Selecione um medicamento do estoque" /></SelectTrigger>
                          <SelectContent>{medicationStock.map(m => <SelectItem key={m.id} value={m.id}>{m.commercialName} ({m.genericName})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Dosagem *</Label><Input value={formData.dosage} onChange={(e) => setFormData({...formData, dosage: e.target.value})} placeholder={selectedMed ? `em ${selectedMed.unit}` : ''} /></div>
                        <div className="space-y-2"><Label>Horário Adm. *</Label><Input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} /></div>
                      </div>
                      <div className="space-y-2"><Label>Frequência *</Label>
                        <div className="flex gap-2 items-center">
                          <Select value={formData.frequencyType} onValueChange={(v) => setFormData({...formData, frequencyType: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hours">A cada X horas</SelectItem><SelectItem value="days">A cada X dias</SelectItem>
                              <SelectItem value="weekly">Semanalmente</SelectItem><SelectItem value="monthly">Mensalmente</SelectItem>
                            </SelectContent>
                          </Select>
                          {(formData.frequencyType === 'hours' || formData.frequencyType === 'days') && <Input type="number" placeholder="Digite o valor de X" value={formData.frequencyValue} onChange={(e) => setFormData({...formData, frequencyValue: e.target.value})} />}
                          {formData.frequencyType === 'monthly' && <Input type="number" placeholder="Dia do mês" value={formData.monthday} onChange={(e) => setFormData({...formData, monthday: e.target.value})} />}
                        </div>
                        {formData.frequencyType === 'weekly' && (
                          <div className="flex flex-wrap gap-2 pt-2">{weekdaysOptions.map((day, i) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox id={`day-${i}`} checked={formData.weekdays.includes(day)} onCheckedChange={(checked) => {
                                const newWeekdays = checked ? [...formData.weekdays, day] : formData.weekdays.filter(d => d !== day);
                                setFormData({...formData, weekdays: newWeekdays});
                              }} /><Label htmlFor={`day-${i}`}>{day}</Label>
                            </div>
                          ))}</div>
                        )}
                      </div>
                      <div className="space-y-2"><Label>Instruções</Label><Textarea value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} /></div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1">Adicionar</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {patientPrescriptions.length > 0 ? patientPrescriptions.map(p => {
              const isCompleted = getDailyStatus(p);
              const completedAt = p.dailyRecords?.[today]?.[p.id]?.completedAt;
              return (
                <div key={p.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 mb-2">
                  <Checkbox checked={isCompleted} onCheckedChange={(checked) => handleItemCheck(p, checked)} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${isCompleted ? 'text-green-600 line-through' : 'text-foreground'}`}>{p.medicationName}</h4>
                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-muted-foreground text-sm">{p.dosage} | <span className="font-semibold">Horário: {p.time}</span></p>
                    {p.instructions && <p className="text-muted-foreground/80 text-sm mt-1">Instruções: {p.instructions}</p>}
                    {isCompleted && completedAt && <p className="text-green-600 text-xs mt-1">Administrado em: {new Date(completedAt).toLocaleString('pt-BR')}</p>}
                  </div>
                </div>
              );
            }) : <p className="text-muted-foreground text-center py-4">Nenhuma prescrição recorrente para este paciente.</p>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}