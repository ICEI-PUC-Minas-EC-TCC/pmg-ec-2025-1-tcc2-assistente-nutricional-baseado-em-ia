
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserProfileSchema, type UserProfileFormValues } from "@/lib/schemas";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

const activityLevels = [
  { value: "sedentary", label: "Sedentário (pouco ou nenhum exercício)" },
  { value: "light", label: "Levemente ativo (exercício leve/esportes 1-3 dias/semana)" },
  { value: "moderate", label: "Moderadamente ativo (exercício moderado/esportes 3-5 dias/semana)" },
  { value: "active", label: "Muito ativo (exercício pesado/esportes 6-7 dias por semana)" },
  { value: "very_active", label: "Extremamente ativo (exercício muito pesado/trabalho físico)" },
];

export default function UserProfileForm() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { profile, saveProfile, isLoading: profileLoading } = useUserProfile();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      name: "",
      age: undefined,
      weight: undefined,
      height: undefined,
      dietaryRestrictions: "",
      activityLevel: "",
      apiKey: "", // Default apiKey
    },
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        age: profile.age === null || profile.age === undefined ? undefined : Number(profile.age),
        weight: profile.weight === null || profile.weight === undefined ? undefined : Number(profile.weight),
        height: profile.height === null || profile.height === undefined ? undefined : Number(profile.height),
        dietaryRestrictions: profile.dietaryRestrictions || "",
        activityLevel: profile.activityLevel || "",
        apiKey: profile.apiKey || "", // Set apiKey from profile
      });
    }
  }, [profile, form]);

  function onSubmit(data: UserProfileFormValues) {
    saveProfile(data);
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações de perfil foram salvas com sucesso.",
    });
  }

  if (authLoading || profileLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Carregando perfil..." /></div>;
  }
  
  if (!currentUser) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Redirecionando para login..." /></div>;
  }


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Seu Perfil</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais. Isso nos ajuda a personalizar sua experiência.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 65" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 170" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dietaryRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restrições Dietéticas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Vegetariano, Sem glúten, Alergia a nozes"
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Liste quaisquer necessidades ou alergias alimentares, separadas por vírgulas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Atividade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nível de atividade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua Google API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Cole sua Google API Key aqui" {...field} />
                  </FormControl>
                  <FormDescription className="flex items-center gap-1">
                    <AlertCircle size={14} className="text-muted-foreground" />
                    Necessária para utilizar as funcionalidades de Inteligência Artificial.
                    Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google AI Studio</a>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <LoadingSpinner size="sm" /> : "Salvar Perfil"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
