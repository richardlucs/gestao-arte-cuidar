
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpenCheck, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function EvolutionTab({ residentId }) {
  const { evolutions, addEvolution, users } = useData();
  const { user: authUser } = useAuth();
  const [content, setContent] = useState('');

  const residentEvolutions = evolutions.filter(e => e.resident_id === residentId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "Erro", description: "O campo de evolução não pode estar vazio.", variant: "destructive" });
      return;
    }

    const currentUserProfile = authUser?.profile;
    const evolutionData = {
      resident_id: residentId,
      user_id: authUser.id,
      user_name: currentUserProfile?.name || authUser.email,
      user_role: currentUserProfile?.role,
      user_occupation: currentUserProfile?.occupation,
      content,
    };

    addEvolution(evolutionData);
    toast({ title: "Sucesso!", description: "Evolução registrada com sucesso." });
    setContent('');
  };
  
  const formatRole = (evo) => {
    if (!evo.user_role) return '';
    if (evo.user_role === 'terceirizado') {
      return evo.user_occupation || 'Terceirizado';
    }
    if (evo.user_role === 'medico_geriatra') {
      return 'Médico Geriatra';
    }
    return evo.user_role.charAt(0).toUpperCase() + evo.user_role.slice(1);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center"><BookOpenCheck className="h-6 w-6 mr-2" />Registrar Nova Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva a evolução do residente aqui..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Registrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Histórico de Evoluções</h3>
        {residentEvolutions.length > 0 ? (
          residentEvolutions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((evo, index) => (
              <motion.div key={evo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground">{evo.content}</p>
                    <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <p>Registrado por: <strong>{evo.user_name} "{formatRole(evo)}"</strong></p>
                      <p>Data: {new Date(evo.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhuma evolução registrada para este residente ainda.</p>
        )}
      </div>
    </div>
  );
}
