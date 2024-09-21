document.addEventListener('DOMContentLoaded', function () {
    const quantidadeInput = document.getElementById('quantidade');
    const valorInput = document.getElementById('valor');

    function calcularValorTotal() {
        const quantidade = parseInt(quantidadeInput.value) || 0;
        let valorTotal = 0;

        // Desconto progressivo baseado na quantidade
        if (quantidade >= 1000) {
            // Cálculo para 1000 ou mais anúncios
            valorTotal = 960 + ((quantidade - 1000) * 0.80); // R$ 960 para 1000 anúncios e R$ 0,96 por anúncio adicional
        } else if (quantidade >= 100) {
            // Cálculo para 100 a 999 anúncios
            valorTotal = 85 + ((quantidade - 100) * 0.85); // R$ 85 para 100 anúncios e R$ 0,85 por anúncio adicional
        } else if (quantidade >= 10) {
            // Cálculo para 10 a 99 anúncios
            valorTotal = 9 + ((quantidade - 10) * 0.90); // R$ 9 para 10 anúncios e R$ 0,90 por anúncio adicional
        } else {
            // Cálculo para menos de 10 anúncios
            valorTotal = quantidade * 1.00; // Sem desconto, R$ 1,00 por anúncio
        }

        valorInput.value = valorTotal.toFixed(2); // Atualiza o campo com o valor total
    }

    // Atualizar o valor sempre que a quantidade mudar
    quantidadeInput.addEventListener('input', calcularValorTotal);
});
