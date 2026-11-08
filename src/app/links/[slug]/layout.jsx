// Mesmo marcador do cardápio: o globals.css mantém a fonte e os fundos próprios da página pública
export default function PublicLinksLayout({ children }) {
  return (
    <>
      <span hidden className="public-menu" />
      {children}
    </>
  );
}
