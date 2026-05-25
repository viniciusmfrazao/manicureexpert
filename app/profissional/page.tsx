import Link from "next/link";
import { ProfessionalDashboard } from "../../components/ProfessionalDashboard";
import { LogoutButton } from "../../components/LogoutButton";

export default function ProfissionalPage() {
  return <main><Header /><section className="pageHero"><span className="eyebrow">Painel profissional</span><h1>Gerencie sua agenda, servicos e portfolio.</h1><p>Salve seu perfil, ative atendimento, defina raio de deslocamento e envie fotos dos seus trabalhos.</p></section><ProfessionalDashboard /></main>;
}

function Header(){return <header className="topbar"><Link className="brand" href="/"><span className="brandMark">ME</span><span><strong>Manicure Expert</strong><small>Sua manicure onde voce estiver.</small></span></Link><nav className="navLinks"><Link href="/cliente">Cliente</Link><Link href="/gestao">Gestao</Link></nav><div className="navAccount"><Link className="navAction" href="/login">Entrar</Link><LogoutButton /></div></header>}
