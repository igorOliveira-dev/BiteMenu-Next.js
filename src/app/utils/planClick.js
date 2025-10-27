export const planClick = (plan) => {
  if (plan === "free") {
    window.location.href = "/dashboard";
  } else {
    alert(`Estamos desenvolvendo o plano ${plan}. Use o plano Free por enquanto!`);
  }
};
