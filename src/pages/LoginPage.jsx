import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const logoUrl = "https://horizons-cdn.hostinger.com/7e24448c-0ef4-47ce-900b-32a45ba8b28c/51ce87665d4b734d49614b775b3ba37d.jpg";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identity: '',
    password: ''
  });
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEmail = formData.identity.includes('@');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identity || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signIn(formData.identity, formData.password);

    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card">
          <CardHeader className="text-center">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img src={logoUrl} alt="Arte e Cuidar Logo" className="h-24"/>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">Acessar Sistema</CardTitle>
            <CardDescription className="text-muted-foreground">
              Faça login com seu e-mail ou telefone para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identity" className="text-foreground">E-mail ou Telefone</Label>
                <div className="relative">
                  {isEmail ? 
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> :
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  }
                  <Input
                    id="identity"
                    type="text"
                    value={formData.identity}
                    onChange={(e) => setFormData({...formData, identity: e.target.value})}
                    className="pl-10"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10"
                    placeholder=""
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}