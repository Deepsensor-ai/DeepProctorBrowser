/**
 * Atividade 3: jQuery
 * Aluno: Simão Moreno
 * nº 110406
 */

var buffer = ''; // variavel buffer que serve para armazenar todos os calculos recentes inseridos pelo usuario
var lastOperador = ''; // variavel para armazenar a ultima operacao inserida pelo operador
var lastCalc = ''; // variavel para armazenar o ultimo calculo efetuado
var resultado; // variavel para armazenar o ultimo resultado
var display = $('#display'); // variavel para armazenar o componente com id display

$('button').click(function() { // ao clicar em qualque botao

    if (this.value) { // se este botao pressionado possuir algum valor

        if (buffer.endsWith(lastOperador) && lastOperador != '' && buffer.length > 1) { // se pressionarmos um botao de operacao e este nao estiver sozinho
            display.val(this.value); //alterar o valor do nosso display pelo valor desse botao inserido
        } else { // senao (enquanto nao pressionarmos um botao de operacao)
            display.val(display.val() + this.value); //acumular valor dos botoes pressionados
        }

        if (lastOperador == 'x') { // se acabamos de efetuar um calculo (pois ultima operacao toma valor x quando efetuarmos um calculo (pressionar botao = ))
            buffer = lastOperador = ''; //entao limpar o buffer que contem os calculos a efetuar e zerar a ultima operacao feita
            display.val(this.value); //alterar o valor do display pelo valor do botao pressionado

        }

        buffer += this.value; //acumular o valor do botao pressionado no buffer de calculos

    } else { //se o botao pressionado nao tiver um valor numerico

        var buttonSimbol = $(this).text(); //variavel para guardar o texto presente no botao pressionado (exemplo: se pressionarmos o botao + buttonSimbol = + )

        if (buttonSimbol === '=') { //se o botao pressionado for o de igual calcular os valores contidos no buffer

            calcular();

        } else if (buttonSimbol === 'C') { // se o botao pressionado for o de limpar o display,

            buffer = lastOperador = ''; // limpar o buffer e zerar a ultima operacao
            display.val(''); // limpar o display

        } else { // se nao (se o botao nao tiver um valor, nao for de igual nem de limpar a tela logo eh um botao de operacao)

            if (buffer.endsWith(lastOperador) && lastOperador != '') { // se pressionamos um botao de operacao e o ultimo botao pressionado for um operador e este nao for vazio devemos desconsiderar o primeiro operador e considerar o ultimo pressionado
                buffer = buffer.slice(0, -1) // remover o ultimo char (neste caso um operador e estamos prontos novamente para adicionar um novo operador)
            }

            if (buttonSimbol == '÷') { // como em programacao esse simbolo nao existe, se o botao pressionado for a de divisao (que contem esse simbolo), logo admitir que o sinal eh o /
                buttonSimbol = '/'
            }

            var operandos = buffer.split(lastOperador); // vamos separar a conta usando a ultima operacao introduzida pelo usuario

            if (operandos.length == 2 && lastOperador != '') { // se tivermos dois operandos e o usuario introduzir mais um novo operador logo calcular usando os dois primeiros operandos
                calcular();
            }

            lastOperador = buttonSimbol; // por fim (depois de clicar num botao), guardar a ultima operacao
            buffer += buttonSimbol; // adicionar a ultima operacao no buffer de calculos
        }
    }
});

function calcular() {

    if (lastOperador == 'x') { // se acabamos de efetuar um calculo e pressionarmos o botao igual

        resultado += lastCalc[lastCalc.length - 1] + lastCalc[lastCalc.length - 2]; //iremos acumular no resultado os dois ultimos elementos da ultima operacao, ou seja, o ultimo operando da operacao anterior e o operador (ex: se a ultima operacao for 8+6, resultado = 14 mas se pressionarmos igual novamente resultado sera 14 + 6 = 20 e assim sucessivamente)
        resultado = (new Function('return ' + resultado)()); // como buffer contem expressoes matematicas, logo vamos retirar esses expressoes dentro de string (se conta = '4+5' resultado = 9)

        display.val(resultado); // setar o display mostrando o resultado
        lastOperador = 'x'; // ultima operacao eh o x, para sinalizar que acabamos de efetuar uma operacao. isto ajuda caso queiramos operar o resultado com outro numero
        buffer = resultado + ''; // buffer ira guardar o resultado em um string caso desejamos operar com o resultado obtido


    } else {
        if (!(buffer.endsWith(lastOperador))) { // se o buffer nao terminar pelo ultimo operador efetuar o calculo, senao ignorar

            resultado = (new Function('return ' + buffer)()); // como buffer contem expressoes matematicas, logo vamos retirar esses expressoes dentro de string (se conta = '4+5' resultado = 9)

            if (lastOperador == '/') { //se o ultimo operador for divisao
                resultado = resultado.toFixed(2); // arredondar o resultado em duas casas decimais
            }

            lastCalc = buffer.split(lastOperador); // ultimo calculo sera um vetor com os operandos
            lastCalc[lastCalc.length] = lastOperador; // adicionar o ultimo operador na ultima posicao do vetor lastCalc

            if (isNaN(resultado)) { // se o resultado nao for um numero limpar o buffer
                buffer = lastOperador = '';
            } else {
                display.val(resultado); // setar o display mostrando o resultado
                lastOperador = 'x'; // ultima operacao eh o x, para sinalizar que acabamos de efetuar uma operacao. isto ajuda caso queiramos operar o resultado com outro numero
                buffer = resultado + ''; // buffer ira guardar o resultado em um string caso desejamos operar com o resultado obtido
            }
        }
    }
}

/**
 * Atividade 3: jQuery
 * Aluno: Simão Moreno
 * nº 110406
 */