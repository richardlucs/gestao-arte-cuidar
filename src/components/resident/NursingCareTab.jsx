
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Heart, CheckCircle, Sun, Moon, Sunset } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function NursingCareTab({ residentId, canEdit }) {
  const { nursingCare, addNursingCare, updateNursingCarePeriod } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ procedure: '', instructions: '', periods: { morning: false, afternoon: false, night: false } });

  const today = new Date().toISOString().split('T')[0];
  const residentCarePlans = nursingCare.filter(c => c.resident_id === residentId);
  const userName = user?.profile?.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.procedure || (!formData.periods.morning && !formData.periods.afternoon && !formData.periods.night)) {
      toast({ title: "Erro", description: "Procedimento e pelo menos um período são obrigatórios.", variant: "destructive" });
      return;
    }
    addNursingCare({ resident_id: residentId, recurring: true, ...formData, created_by: userName });
    toast({ title: "Sucesso!", description: "Plano de cuidado adicionado." });
    setFormData({ procedure: '', instructions: '', periods: { morning: false, afternoon: false, night: false } });
    setIsDialogOpen(false);
  };

  const handlePeriodClick = (careId, period) => {
    updateNursingCarePeriod(careId, today, period, user.profile.name);
    toast({ title: "Período confirmado!", description: `Cuidado do período da ${period === 'morning' ? 'manhã' : period === 'afternoon' ? 'tarde' : 'noite'} realizado.` });
  };

  const PeriodButton = ({ care, period, icon: Icon, label }) => {
    const isCompleted = care.daily_records?.[today]?.[period]?.completed;
    return (
      <Button
        variant={isCompleted ? 'default' : 'outline'}
        size="sm"
        className={`flex-1 ${isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}`}
        onClick={() => handlePeriodClick(care.id, period)}
        disabled={!care.periods?.[period] || !canEdit}
      >
        <Icon className="h-4 w-4 mr-2" />
        {label}
        {isCompleted && <CheckCircle className="h-4 w-4 ml-2" />}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center"><Heart className="h-6 w-6 mr-2" />Cuidados de Enfermagem de Hoje</CardTitle>
              {canEdit && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild><Button className="bg-pink-500 hover:bg-pink-600 text-white"><Plus className="h-4 w-4 mr-2" />Novo Plano de Cuidado</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Plano de Cuidado</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="procedure">Procedimento *</Label><Input id="procedure" value={formData.procedure} onChange={(e) => setFormData({...formData, procedure: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Períodos *</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2"><Checkbox id="morning" checked={formData.periods.morning} onCheckedChange={(c) => setFormData({...formData, periods: {...formData.periods, morning: c}})} /><Label htmlFor="morning">Manhã</Label></div>
                          <div className="flex items-center space-x-2"><Checkbox id="afternoon" checked={formData.periods.afternoon} onCheckedChange={(c) => setFormData({...formData, periods: {...formData.periods, afternoon: c}})} /><Label htmlFor="afternoon">Tarde</Label></div>
                          <div className="flex items-center space-x-2"><Checkbox id="night" checked={formData.periods.night} onCheckedChange={(c) => setFormData({...formData, periods: {...formData.periods, night: c}})} /><Label htmlFor="night">Noite</Label></div>
                        </div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="instructions">Instruções</Label><Textarea id="instructions" value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} /></div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1">Adicionar</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {residentCarePlans.length > 0 ? residentCarePlans.map(care => (
              <div key={care.id} className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground">{care.procedure}</h4>
                {care.instructions && <p className="text-muted-foreground/80 text-sm mt-1">{care.instructions}</p>}
                <div className="flex gap-2 mt-3">
                  <PeriodButton care={care} period="morning" icon={Sun} label="Manhã" />
                  <PeriodButton care={care} period="afternoon" icon={Sunset} label="Tarde" />
                  <PeriodButton care={care} period="night" icon={Moon} label="Noite" />
                </div>
                {Object.entries(care.daily_records?.[today] || {}).map(([period, data]) => (
                  data.completed && <p key={period} className="text-green-600 text-xs mt-1 capitalize">{period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'} por {data.completedBy} em: {new Date(data.completedAt).toLocaleTimeString('pt-BR')}</p>
                ))}
              </div>
            )) : <p className="text-muted-foreground text-center py-4">Nenhum plano de cuidado recorrente para este residente.</p>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
