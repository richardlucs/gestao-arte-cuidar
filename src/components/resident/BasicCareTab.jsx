
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Calendar, Utensils, Bath, Bath as Toilet, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const bristolScale = [
  { number: 1, description: 'Pedaços duros separados' }, { number: 2, description: 'Formato de salsicha grumosa' },
  { number: 3, description: 'Formato de salsicha com rachaduras' }, { number: 4, description: 'Formato de salsicha lisa' },
  { number: 5, description: 'Pedaços macios com bordas definidas' }, { number: 6, description: 'Pedaços fofos com bordas irregulares' },
  { number: 7, description: 'Aquosa, sem pedaços sólidos' }
];

const initialFormData = { evacuation: null, evacuation_notes: '', bath: false, bath_notes: '', feeding: false, feeding_notes: '' };

export default function BasicCareTab({ residentId, canEdit }) {
  const { basicCare, addOrUpdateBasicCare } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const residentBasicCare = basicCare.filter(c => c.resident_id === residentId);
  const today = new Date().toISOString().split('T')[0];
  const todaysCare = residentBasicCare.find(c => c.date === today);

  useEffect(() => {
    if (todaysCare) {
      setFormData({
        evacuation: todaysCare.evacuation || null, evacuation_notes: todaysCare.evacuation_notes || '',
        bath: todaysCare.bath || false, bath_notes: todaysCare.bath_notes || '',
        feeding: todaysCare.feeding || false, feeding_notes: todaysCare.feeding_notes || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [todaysCare]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.evacuation === null && !formData.bath && !formData.feeding) {
      toast({ title: "Erro", description: "Registre pelo menos um cuidado básico.", variant: "destructive" });
      return;
    }
    
    const userName = user?.profile?.name;

    const careData = {
      resident_id: residentId, ...formData,
      ...(todaysCare ? { updated_by: userName } : { created_by: userName })
    };

    addOrUpdateBasicCare(careData);
    toast({ title: "Sucesso!", description: `Controle básico ${todaysCare ? 'atualizado' : 'registrado'}.` });
    setIsDialogOpen(false);
  };

  const getBristolDescription = (number) => bristolScale.find(s => s.number === number)?.description || '';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center"><Users className="h-6 w-6 mr-2" />Controle de Cuidados Básicos</CardTitle>
              {canEdit && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      {todaysCare ? <><Edit className="h-4 w-4 mr-2" />Editar Registro de Hoje</> : <><Plus className="h-4 w-4 mr-2" />Registrar Cuidados</>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{todaysCare ? 'Editar' : 'Registrar'} Cuidados Básicos</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center"><Toilet className="h-5 w-5 mr-2" />Evacuação (Escala de Bristol)</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {bristolScale.map((item) => (
                            <div key={item.number} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${formData.evacuation === item.number ? 'bg-primary/20' : 'hover:bg-muted/50'}`} onClick={() => setFormData({...formData, evacuation: item.number})}>
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mr-3">{item.number}</div>
                              <div className="text-sm">{item.description}</div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2"><Label htmlFor="evacuation_notes">Observações</Label><Textarea id="evacuation_notes" value={formData.evacuation_notes} onChange={(e) => setFormData({...formData, evacuation_notes: e.target.value})} /></div>
                      </div>
                      <div className="space-y-4"><h3 className="text-lg font-semibold flex items-center"><Bath className="h-5 w-5 mr-2" />Banho</h3><div className="flex items-center space-x-2"><Checkbox id="bath" checked={formData.bath} onCheckedChange={(c) => setFormData({...formData, bath: c})} /><Label htmlFor="bath">Banho realizado</Label></div><div className="space-y-2"><Label htmlFor="bath_notes">Observações</Label><Textarea id="bath_notes" value={formData.bath_notes} onChange={(e) => setFormData({...formData, bath_notes: e.target.value})} /></div></div>
                      <div className="space-y-4"><h3 className="text-lg font-semibold flex items-center"><Utensils className="h-5 w-5 mr-2" />Alimentação</h3><div className="flex items-center space-x-2"><Checkbox id="feeding" checked={formData.feeding} onCheckedChange={(c) => setFormData({...formData, feeding: c})} /><Label htmlFor="feeding">Alimentação realizada</Label></div><div className="space-y-2"><Label htmlFor="feeding_notes">Observações</Label><Textarea id="feeding_notes" value={formData.feeding_notes} onChange={(e) => setFormData({...formData, feeding_notes: e.target.value})} /></div></div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1">{todaysCare ? 'Atualizar' : 'Registrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {todaysCare && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="border-green-500/50 bg-green-500/10">
            <CardHeader><CardTitle className="text-foreground flex items-center"><Calendar className="h-6 w-6 mr-2" />Cuidados de Hoje</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><h4 className="font-medium text-foreground flex items-center"><Toilet className="h-4 w-4 mr-2" />Evacuação</h4>{todaysCare.evacuation ? <div><p className="text-muted-foreground">Tipo {todaysCare.evacuation}: {getBristolDescription(todaysCare.evacuation)}</p>{todaysCare.evacuation_notes && <p className="text-muted-foreground/80 text-sm mt-1">{todaysCare.evacuation_notes}</p>}</div> : <p className="text-muted-foreground/80">Não registrado</p>}</div>
                <div><h4 className="font-medium text-foreground flex items-center"><Bath className="h-4 w-4 mr-2" />Banho</h4><p className={`${todaysCare.bath ? 'text-green-600' : 'text-muted-foreground/80'}`}>{todaysCare.bath ? 'Realizado' : 'Não realizado'}</p>{todaysCare.bath_notes && <p className="text-muted-foreground/80 text-sm">{todaysCare.bath_notes}</p>}</div>
                <div><h4 className="font-medium text-foreground flex items-center"><Utensils className="h-4 w-4 mr-2" />Alimentação</h4><p className={`${todaysCare.feeding ? 'text-green-600' : 'text-muted-foreground/80'}`}>{todaysCare.feeding ? 'Realizada' : 'Não realizada'}</p>{todaysCare.feeding_notes && <p className="text-muted-foreground/80 text-sm">{todaysCare.feeding_notes}</p>}</div>
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>Registrado por: {todaysCare.created_by} em {new Date(todaysCare.created_at).toLocaleString('pt-BR')}</p>
                {todaysCare.updated_by && <p>Última alteração por: {todaysCare.updated_by} em {new Date(todaysCare.updated_at).toLocaleString('pt-BR')}</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Histórico de Cuidados</h3>
        {residentBasicCare.filter(c => c.date !== today).sort((a, b) => new Date(b.date) - new Date(a.date)).map((care, index) => (
          <motion.div key={care.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}>
            <Card><CardHeader><CardTitle className="text-foreground flex items-center text-lg"><Calendar className="h-5 w-5 mr-2" />{new Date(care.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle></CardHeader><CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><h4 className="font-medium text-foreground flex items-center"><Toilet className="h-4 w-4 mr-2" />Evacuação</h4>{care.evacuation ? <div><p className="text-muted-foreground">Tipo {care.evacuation}: {getBristolDescription(care.evacuation)}</p>{care.evacuation_notes && <p className="text-muted-foreground/80 text-sm mt-1">{care.evacuation_notes}</p>}</div> : <p className="text-muted-foreground/80">Não registrado</p>}</div>
                <div><h4 className="font-medium text-foreground flex items-center"><Bath className="h-4 w-4 mr-2" />Banho</h4><p className={`${care.bath ? 'text-green-600' : 'text-muted-foreground/80'}`}>{care.bath ? 'Realizado' : 'Não realizado'}</p>{care.bath_notes && <p className="text-muted-foreground/80 text-sm">{care.bath_notes}</p>}</div>
                <div><h4 className="font-medium text-foreground flex items-center"><Utensils className="h-4 w-4 mr-2" />Alimentação</h4><p className={`${care.feeding ? 'text-green-600' : 'text-muted-foreground/80'}`}>{care.feeding ? 'Realizada' : 'Não realizada'}</p>{care.feeding_notes && <p className="text-muted-foreground/80 text-sm">{care.feeding_notes}</p>}</div>
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground"><p>Registrado por: {care.created_by}</p>{care.updated_by && <p>Alterado por: {care.updated_by}</p>}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
