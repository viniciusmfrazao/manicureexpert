import Link from "next/link";
import { CustomerSearch } from "../../components/CustomerSearch";

export default function ClientePage() {
  return <main><Header /><section className="pageHero"><span className="eyebrow">Painel da cliente</span><h1>Agende seu atendimento em casa.</h1><p>Informe o endereco, escolha o servico e veja profissionais verificadas perto de voce com horarios, valores, fotos e disponibilidade.</p></section><section className="pageGrid"><CustomerSearch /></section></main>;
}

function Header(){return <header className="topbar"><Link className="brand" href="/"><span className="brandMark">ME</span><span><strong>Manicure Expert</strong><small>Sua manicure onde voce estiver.</small></span></Link><nav className="navLinks"><Link href="/profissional">Profissional</Link><Link href="/gestao">Gestao</Link></nav><Link className="navAction" href="/login">Entrar</Link></header>}
