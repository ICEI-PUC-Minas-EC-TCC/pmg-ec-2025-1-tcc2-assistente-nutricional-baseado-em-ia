
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Utensils, User, Camera, MessageSquare, SearchCheck, Refrigerator, ChefHat, ShoppingCart, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-12">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
          <Utensils className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-4">Bem-vindo ao Assistente Nutricional</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Seu parceiro inteligente para rastreamento nutricional, análise de refeições e receitas personalizadas. Fotografe, analise e prospere!
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<User className="w-10 h-10 text-primary" />}
          title="Gerencie Seu Perfil"
          description="Personalize sua experiência configurando seus detalhes de saúde e preferências."
          link="/profile"
          linkText="Ir para o Perfil"
        />
        <FeatureCard
          icon={<Camera className="w-10 h-10 text-primary" />}
          title="Analise Sua Refeição"
          description="Tire uma foto da sua refeição e obtenha uma análise nutricional detalhada com IA."
          link="/analyze-meal"
          linkText="Analisar Refeição"
        />
        <FeatureCard
          icon={<Refrigerator className="w-10 h-10 text-primary" />}
          title="Da Geladeira para a Receita"
          description="Tire uma foto dos ingredientes da sua geladeira e deixe a IA gerar uma receita personalizada para você."
          link="/fridge-recipe"
          linkText="Gerar Receita da Geladeira"
        />
        <FeatureCard
          icon={<ChefHat className="w-10 h-10 text-primary" />}
          title="Receitas Personalizadas"
          description="Obtenha receitas adaptadas aos seus ingredientes disponíveis, dieta e gostos."
          link="/generate-recipe"
          linkText="Obter Receitas"
        />
         <FeatureCard
          icon={<SearchCheck className="w-10 h-10 text-primary" />}
          title="Classificar Alimento"
          description="Envie uma imagem de alimento para ver classificações potenciais."
          link="/classify-food"
          linkText="Classificar Alimento"
        />
        <FeatureCard
          icon={<MessageSquare className="w-10 h-10 text-primary" />}
          title="Chat de Nutrição"
          description="Pergunte ao nosso assistente de IA suas dúvidas relacionadas à nutrição."
          link="/chat"
          linkText="Iniciar Chat"
        />
        <FeatureCard
          icon={<ShoppingCart className="w-10 h-10 text-primary" />}
          title="Planejador de Compras"
          description="Crie um plano de refeições para vários dias com base na sua lista de compras."
          link="/shopping-list-planner"
          linkText="Planejar Compras"
        />
      </div>

      <footer className="mt-16 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Assistente Nutricional. Sua saúde, simplificada.</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

function FeatureCard({ icon, title, description, link, linkText }: FeatureCardProps) {
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="items-center text-center pt-6">
        <div className="p-3 bg-primary/10 rounded-full mb-3">{icon}</div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-center px-4 pb-4">
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
      <CardFooter className="justify-center p-4 bg-muted/30">
        <Button asChild variant="default" className="w-full sm:w-auto rounded-md">
          <Link href={link}>{linkText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
