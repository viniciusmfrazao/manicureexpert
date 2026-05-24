"use client";

import { useState } from "react";
import Link from "next/link";

export function CustomerSearch() {
  const [address, setAddress] = useState("Av. Paulista, 1000 - São Paulo");
  const [locationStatus, setLocationStatus] = useState("Você também pode usar a localização automática do celular.");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Seu navegador não liberou localização automática.");
      return;
    }

    setLocationStatus("Buscando sua localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setAddress(`Localização atual: ${latitude}, ${longitude}`);
        setLocationStatus("Localização capturada. Agora busque profissionais próximas.");
      },
      () => setLocationStatus("Não foi possível acessar sua localização."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form className="pageCard stack">
      <h2>Buscar profissional</h2>
      <label>Endereço<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
      <button className="ghostButton" type="button" onClick={useCurrentLocation}>Usar minha localização</button>
      <p className="helperText">{locationStatus}</p>
      <label>Serviço<select defaultValue="Manicure e pedicure"><option>Manicure e pedicure</option><option>Manicure</option><option>Pedicure</option><option>Alongamento</option></select></label>
      <div className="inlineFields"><label>Data<input type="date" defaultValue="2026-05-25" /></label><label>Horário<input type="time" defaultValue="15:30" /></label></div>
      <a className="formButton" href="#resultados">Ver disponíveis</a>
      <Link className="secondaryFormButton" href="/login">Entrar para agendar</Link>
    </form>
  );
}
