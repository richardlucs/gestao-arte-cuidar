import React, { useState } from 'react';
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
import { Plus, FileText, CheckCircle, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const initialItemState = {
  medicationId: '',
  dosage: '',
  time: '',
  instructions: ''
};

export default function PrescriptionTab({ residentId }) {
  const {
    prescriptions,
    addOrUpdatePrescription,
    updatePrescriptionItemStatus,
    deletePrescriptionItem,
    updatePrescriptionItem: editPrescriptionItem,
    medicationStock,
    updateMedicationStock,
    addAlert
  } = useData();
  const { user, displayName } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState(initialItemState);
  
  const residentMedStock = medicationStock.filter(m => m.residentId === residentId);
  const residentPrescription = prescriptions.find(p => p.residentId === residentId);
  
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const canEditPrescription = ['administrador', 'medico_geriatra'].includes(user?.role);

  const handleAddItem = () => {
    if (!newItem.medicationId || !newItem.dosage || !newItem.time) {
      toast({ title: "Erro", description: "Medicamento, dosagem e horário são obrigatórios.", variant: "destructive" });
      return;
    }
    
    if(editingItem) {
      editPrescriptionItem(residentId, editingItem.id, newItem);
      toast({ title: "Sucesso!", description: "Item da prescrição atualizado." });
      setEditingItem(null);
    } else {
      addOrUpdatePrescription(residentId, { items: [newItem], updatedBy: displayName });
      toast({ title: "Sucesso!", description: "Medicamento adicionado à prescrição." });
    }
    
    setNewItem(initialItemState);
  };
  
  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({ ...item });
  };
  
  const handleDeleteItem = (itemId) => {
    deletePrescriptionItem(residentId, itemId);
    toast({ title: "Sucesso", description: "Item removido da prescrição."});
  };

  const handleItemCheck = (item, checked) => {
    updatePrescriptionItemStatus(residentId, item.id, todayString, checked, user);
    
    const medInStock = residentMedStock.find(m => m.id === item.medicationId);
    if (medInStock) {
      const amount = checked ? -1 : 1;
      updateMedicationStock(medInStock.id, { amount, reason: `Administração ${checked ? '' : 'revertida'}`, user: user?.name });
      
      const newQuantity = (medInStock.quantity || 0) + amount;
      if (newQuantity < parseInt(medInStock.minStock || 0)) {
        addAlert({ type: 'stock', message: `Estoque baixo para ${medInStock.nome_medicamento}. Quantidade atual: ${newQuantity}.` });
      }
    }
    toast({ title: checked ? "Item confirmado!" : "Confirmação removida" });
  };

  const getDailyStatus = item => residentPrescription?.dailyRecords?.[todayString]?.[item.id]?.completed || false;
  const record = (item) => residentPrescription?.dailyRecords?.[todayString]?.[item.id];

  return <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center"><FileText className="h-6 w-6 mr-2" />Receituário do Dia</CardTitle>
              {canEditPrescription && 
                <Button className="bg-purple-500 hover:bg-purple-600 text-white" onClick={() => { setIsEditModalOpen(true); setEditingItem(null); setNewItem(initialItemState); }}>
                  <Edit className="h-4 w-4 mr-2" />Editar Receituário
                </Button>
              }
            </div>
             <p className="text-muted-foreground flex items-center text-sm pt-2"><Calendar className="h-4 w-4 mr-2" />{formattedDate}</p>
          </CardHeader>
          <CardContent>
            {residentPrescription?.items && residentPrescription.items.length > 0 ? residentPrescription.items.sort((a, b) => a.time.localeCompare(b.time)).map(item => {
              const medInfo = residentMedStock.find(m => m.id === item.medicationId);
              const isCompleted = getDailyStatus(item);
              const itemRecord = record(item);
              const canUncheck = !isCompleted || (itemRecord && itemRecord.completedBy === displayName);

              return <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 mb-2">
                { canUncheck ? (
                  isCompleted ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Checkbox id={`item-${item.id}`} checked={isCompleted} className="mt-1" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar Ação</AlertDialogTitle><AlertDialogDescription>Certeza que deseja retirar a confirmação de administração do medicamento?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleItemCheck(item, false)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Checkbox id={`item-${item.id}`} checked={isCompleted} onCheckedChange={checked => handleItemCheck(item, checked)} className="mt-1" />
                  )
                ) : (
                  <Checkbox id={`item-${item.id}`} checked={isCompleted} disabled className="mt-1" />
                )
                }
                <div className="flex-1">
                  <Label htmlFor={`item-${item.id}`} className={`flex items-center space-x-2 ${canUncheck ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <h4 className={`font-medium ${isCompleted ? 'text-green-600 line-through' : 'text-foreground'}`}>{medInfo?.nome_medicamento || 'Medicamento não encontrado'}</h4>
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Label>
                  <p className="text-muted-foreground text-sm">{item.dosage} | <span className="font-semibold">Horário: {item.time}</span></p>
                  {item.instructions && <p className="text-muted-foreground/80 text-sm mt-1">Instruções: {item.instructions}</p>}
                  {isCompleted && itemRecord?.completedAt && <p className="text-green-600 text-xs mt-1">Administrado por {itemRecord.completedBy} em: {new Date(itemRecord.completedAt).toLocaleString('pt-BR')}</p>}
                </div>
              </div>;
            }) : <p className="text-muted-foreground text-center py-4">Nenhum medicamento no receituário deste residente.</p>}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Editar Receituário</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">{editingItem ? "Editando Item" : "Adicionar Novo Medicamento"}</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Medicamento *</Label>
                  <Select onValueChange={v => setNewItem({ ...newItem, medicationId: v })} value={newItem.medicationId}>
                    <SelectTrigger><SelectValue placeholder="Selecione do estoque..." /></SelectTrigger>
                    <SelectContent>{residentMedStock.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_medicamento} ({m.apresentacao})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Dosagem *</Label><Input value={newItem.dosage} onChange={e => setNewItem({ ...newItem, dosage: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Horário de Administração *</Label><Input type="time" value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Instruções</Label><Textarea value={newItem.instructions} onChange={e => setNewItem({ ...newItem, instructions: e.target.value })} /></div>
                <Button onClick={handleAddItem}><Plus className="h-4 w-4 mr-2" />{editingItem ? "Salvar Alterações" : "Adicionar Item"}</Button>
                 {editingItem && <Button variant="outline" onClick={() => { setEditingItem(null); setNewItem(initialItemState); }}>Cancelar Edição</Button>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Itens Atuais no Receituário</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {residentPrescription?.items.map(item => {
                  const medInfo = residentMedStock.find(m => m.id === item.medicationId);
                  return <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div>
                            <p className="font-medium">{medInfo?.nome_medicamento || 'Medicamento não encontrado'}</p>
                            <p className="text-sm text-muted-foreground">{item.dosage} às {item.time}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover este item do receituário?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>;
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}