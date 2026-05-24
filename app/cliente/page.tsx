import Link from "next/link";
import { CustomerSearch } from "../../components/CustomerSearch";

export default function ClientePage() {
  const pros = [["Camila Rocha", "2,3 km", "R$ 75", "Manicure, pedicure e nail art"], ["Juliana Martins", "3,1 km", "R$ 95", "Fibra, gel e spa dos pés"]];
  return <main><Header /><section className="pageHero"><span className="eyebrow">Painel da cliente</span><h1>Agende seu atendimento em casa.</h1><p>Informe o endereço, escolha o serviço e veja profissionais verificadas perto de você com horários disponíveis.</p></section><section className="pageGrid"><CustomerSearch /><div className="professionalsGrid" id="resultados">{pros.map(([name, distance, price, bio]) => <article className="professionalCard" key={name}><img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" alt="" /><div><div className="cardTitleRow"><strong>{name}</strong><span>Verificada</span></div><p>{bio}. Aceita atendimento em domicílio hoje.</p><div className="metaRow"><span>★ 4,9</span><span>{distance}</span><span>Disponível</span></div><Link href="/login">Solicitar {price}</Link></div></article>)}</div></section></main>;
}

function Header(){return <header className="topbar"><Link className="brand" href="/"><span className="brandMark">ME</span><span><strong>Manicure Expert</strong><small>Sua manicure onde você estiver.</small></span></Link><nav className="navLinks"><Link href="/profissional">Profissional</Link><Link href="/gestao">Gestão</Link></nav><Link className="navAction" href="/login">Entrar</Link></header>}
