// Marcador para o globals.css manter a fonte e os fundos próprios do cardápio público
export default function PublicMenuLayout({ children }) {
  return (
    <>
      <span hidden className="public-menu" />
      {children}
    </>
  );
}
