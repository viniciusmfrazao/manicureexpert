import Link from "next/link";
import { ProfessionalDashboard } from "../../components/ProfessionalDashboard";

export default function ProfissionalPage() {
  return <main><Header /><section className="pageHero"><span className="eyebrow">Painel profissional</span><h1>Gerencie sua agenda, serviços e portfólio.</h1><p>Salve seu perfil, ative atendimento, defina raio de deslocamento e envie fotos dos seus trabalhos.</p></section><ProfessionalDashboard /></main>;
}

function Header(){return <header className="topbar"><Link className="brand" href="/"><span className="brandMark">ME</span><span><strong>Manicure Expert</strong><small>Sua manicure onde você estiver.</small></span></Link><nav className="navLinks"><Link href="/cliente">Cliente</Link><Link href="/gestao">Gestão</Link></nav><Link className="navAction" href="/login">Entrar</Link></header>}
