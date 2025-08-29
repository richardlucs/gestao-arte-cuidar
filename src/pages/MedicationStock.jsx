import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, ArrowRightLeft, AlertTriangle, Edit, FileDown, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { exportToPDF, exportToExcel } from '@/lib/utils';
import { useParams } from 'react-router-dom';

const initialFormState = {
  nome_medicamento: '',
  apresentacao: '',
  unidade_estoque: '',
  unidade_dose_padrao: '',
  fator_conversao: '',
  minStock: '',
};

const stockUnits = ["comprimido", "capsula", "ampola", "frasco", "ml", "gota", "sache", "unidade"];
const doseUnits = ["mg", "ml", "gota", "comprimido", "unidade"];

export default function MedicationStock() {
  const { residentId } = useParams();
  const { medicationStock, addMedication, updateMedication, updateMedicationStock: moveStock, addAlert, residents } = useData();
  const { user, displayName } = useAuth();
  
  const userRole = user?.role;
  const resident = residents.find(r => r.id === residentId);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [moveFormData, setMoveFormData] = useState({ amount: '', type: 'entrada', reason: '' });
  const [conversionInfo, setConversionInfo] = useState({ show: false, label: '', placeholder: '', help: '' });

  const residentMedStock = useMemo(() => 
    medicationStock.filter(med => med.residentId === residentId),
  [medicationStock, residentId]);

  const stockAlerts = useMemo(() => 
    residentMedStock.filter(med => (med.quantity || 0) < parseInt(med.minStock || 0)),
  [residentMedStock]);

  useEffect(() => {
    const { unidade_dose_padrao, unidade_estoque } = formData;
    let show = false, label = '', placeholder = '', help = '';

    const discreteStockUnits = ["comprimido", "capsula", "ampola", "unidade", "frasco"];

    if (unidade_dose_padrao === 'mg' && discreteStockUnits.includes(unidade_estoque)) {
      show = true; label = "mg por unidade"; placeholder = "500"; help = "Informe quantos mg há em 1 unidade do estoque (ex.: 500 mg por comprimido).";
    } else if (unidade_dose_padrao === 'mg' && unidade_estoque === 'ml') {
      show = true; label = "mg por mL"; placeholder = "100"; help = "Informe quantos mg há em 1 mL (ex.: 100 mg/mL).";
    } else if (unidade_estoque === 'frasco') {
      show = true; label = "mL por frasco"; placeholder = "200"; help = "Informe o volume total do frasco em mL (ex.: 200 mL por frasco).";
    } else if (unidade_dose_padrao === 'gota' && unidade_estoque === 'ml') {
      show = true; label = "gotas por mL"; placeholder = "20"; help = "Informe quantas gotas há em 1 mL (ex.: 20 gotas/mL).";
    } else if (unidade_dose_padrao === unidade_estoque) {
      show = false;
    }
    
    setConversionInfo({ show, label, placeholder, help });
  }, [formData.unidade_dose_padrao, formData.unidade_estoque]);

  const handleOpenForm = (med = null) => {
    setEditingMed(med);
    setFormData(med ? { ...med } : initialFormState);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const { nome_medicamento, apresentacao, unidade_estoque, unidade_dose_padrao, fator_conversao } = formData;
    if (!nome_medicamento || !apresentacao || !unidade_estoque || !unidade_dose_padrao) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (conversionInfo.show && (!fator_conversao || parseFloat(fator_conversao) <= 0)) {
      toast({ title: "Erro", description: `O campo "${conversionInfo.label}" é obrigatório e deve ser maior que zero.`, variant: "destructive" });
      return;
    }

    const data = { ...formData, residentId };
    if (editingMed) {
      updateMedication(editingMed.id, data);
      toast({ title: "Sucesso!", description: "Medicamento atualizado." });
    } else {
      addMedication(data);
      toast({ title: "Sucesso!", description: "Medicamento cadastrado." });
    }
    setIsFormOpen(false);
  };

  const handleMoveSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(moveFormData.amount) * (moveFormData.type === 'entrada' ? 1 : -1);
    moveStock(selectedMed.id, { amount, reason: moveFormData.reason, user: user?.name });
    
    const updatedMed = medicationStock.find(m => m.id === selectedMed.id);
    const newQuantity = (updatedMed?.quantity || 0) + amount;
    if (newQuantity < parseInt(updatedMed.minStock || 0)) {
      addAlert({ type: 'stock', message: `Estoque baixo para ${updatedMed.nome_medicamento}. Quantidade atual: ${newQuantity}.` });
    }
    toast({ title: "Sucesso!", description: "Movimentação de estoque registrada." });
    setIsMoveOpen(false);
  };

  const getStockLevelColor = (med) => {
    const quantity = med.quantity || 0;
    const minStock = parseInt(med.minStock || 0);
    if (quantity <= 0) return 'bg-red-100 border-red-500';
    if (quantity < minStock) return 'bg-yellow-100 border-yellow-500';
    return 'bg-card';
  };

  const handleExport = (format) => {
    const dataToExport = residentMedStock.map(m => ({
      'Nome do Medicamento': m.nome_medicamento,
      'Apresentação': m.apresentacao,
      'Estoque Atual': `${m.quantity || 0} ${m.unidade_estoque}`,
      'Estoque Mínimo': m.minStock || 'N/A',
    }));
    const headers = ['Nome do Medicamento', 'Apresentação', 'Estoque Atual', 'Estoque Mínimo'];
    const title = `Relatório de Estoque - ${resident.name}`;
    const sections = [{ title, data: dataToExport, headers }];

    if (format === 'pdf') {
      exportToPDF(title, sections);
    } else {
      exportToExcel(sections, `estoque_${resident.name.toLowerCase().replace(/ /g, '_')}`);
    }
  };

  if (!resident) {
    return <Layout title="Residente não encontrado" showBackButton={true} />;
  }

  const canManageStock = ['administrador', 'supervisor'].includes(userRole);

  return (
    <Layout title={`Estoque de Medicação - ${resident.name}`} showBackButton={true}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center"><Package className="h-6 w-6 mr-2" />Estoque</CardTitle>
                <div className="flex gap-2">
                  {canManageStock && <Button onClick={() => handleOpenForm()}><Plus className="h-4 w-4 mr-2" />Cadastrar Medicamento</Button>}
                  <Button variant="outline" onClick={() => handleExport('pdf')}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
                  <Button variant="outline" onClick={() => handleExport('excel')}><FileDown className="h-4 w-4 mr-2" />Excel</Button>
                </div>
              </div>
            </CardHeader>
            {stockAlerts.length > 0 && (
              <CardContent>
                <div className="p-4 rounded-md bg-yellow-100 border border-yellow-500">
                  <h4 className="font-semibold text-yellow-800 flex items-center"><AlertTriangle className="h-5 w-5 mr-2" />Alertas de Estoque Mínimo</h4>
                  <ul className="list-disc pl-5 mt-2 text-yellow-700 text-sm">
                    {stockAlerts.map(med => <li key={med.id}>{med.nome_medicamento} (Estoque: {med.quantity || 0})</li>)}
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {residentMedStock.map((med, index) => (
            <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card className={getStockLevelColor(med)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{med.nome_medicamento}</CardTitle><CardDescription>{med.apresentacao}</CardDescription></div>
                    {canManageStock && <Button variant="ghost" size="icon" onClick={() => handleOpenForm(med)}><Edit className="h-4 w-4" /></Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{med.quantity || 0} <span className="text-sm font-normal">{med.unidade_estoque}</span></p>
                  <p className="text-sm text-muted-foreground">Estoque Mínimo: {med.minStock || 'N/A'}</p>
                  {canManageStock && <Button className="w-full mt-4" variant="secondary" onClick={() => { setSelectedMed(med); setIsMoveOpen(true); }}><ArrowRightLeft className="h-4 w-4 mr-2" />Movimentar Estoque</Button>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingMed ? 'Editar' : 'Cadastrar'} Medicamento</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
            <div className="space-y-2"><Label htmlFor="nome_medicamento">Nome do Medicamento *</Label><Input id="nome_medicamento" value={formData.nome_medicamento} onChange={e => setFormData({...formData, nome_medicamento: e.target.value})} placeholder="Dipirona" /><p className="text-xs text-muted-foreground">Nome pelo qual a equipe reconhece o medicamento.</p></div>
            <div className="space-y-2"><Label htmlFor="apresentacao">Apresentação *</Label><Input id="apresentacao" value={formData.apresentacao} onChange={e => setFormData({...formData, apresentacao: e.target.value})} placeholder="500 mg comprimido" /><p className="text-xs text-muted-foreground">Use 'força + forma'. Ex.: 500 mg comprimido; 100 mg/mL solução oral.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unidade de estoque (como é armazenado) *</Label><Select value={formData.unidade_estoque} onValueChange={v => setFormData({...formData, unidade_estoque: v})}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{stockUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Forma física no almoxarifado (ex.: frasco).</p>{formData.unidade_estoque === 'ml' && <p className="text-xs text-orange-500 flex items-center gap-1"><Info size={14}/>Use 'ml' somente se o estoque for controlado por volume direto.</p>}</div>
              <div className="space-y-2"><Label>Unidade da dose (como é prescrito) *</Label><Select value={formData.unidade_dose_padrao} onValueChange={v => setFormData({...formData, unidade_dose_padrao: v})}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{doseUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Como a dose é registrada na prescrição (ex.: mg).</p></div>
            </div>
            {conversionInfo.show && (<div className="space-y-2"><Label htmlFor="fator_conversao">{conversionInfo.label} *</Label><Input id="fator_conversao" type="number" value={formData.fator_conversao} onChange={e => setFormData({...formData, fator_conversao: e.target.value})} placeholder={conversionInfo.placeholder} /><p className="text-xs text-muted-foreground">{conversionInfo.help}</p></div>)}
            <div className="space-y-2"><Label htmlFor="minStock">Estoque Mínimo</Label><Input id="minStock" type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} placeholder="20" /></div>
            <div className="col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button><Button type="submit">{editingMed ? 'Salvar' : 'Cadastrar'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Movimentar Estoque: {selectedMed?.nome_medicamento}</DialogTitle></DialogHeader>
          <form onSubmit={handleMoveSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Tipo</Label><Select value={moveFormData.type} onValueChange={v => setMoveFormData({...moveFormData, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entrada">Entrada (Abastecimento)</SelectItem><SelectItem value="saida">Saída Manual (Perda/Descarte)</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Quantidade ({selectedMed?.unidade_estoque})</Label><Input type="number" value={moveFormData.amount} onChange={e => setMoveFormData({...moveFormData, amount: e.target.value})} /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input value={moveFormData.reason} onChange={e => setMoveFormData({...moveFormData, reason: e.target.value})} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsMoveOpen(false)}>Cancelar</Button><Button type="submit">Registrar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}