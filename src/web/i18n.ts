const en = {
  title: 'LK',
  random: 'Zen',
  campaign: 'Campaign',
  menu: 'Menu',
  undo: 'Undo',
  level: 'Level',
  paused: 'Paused',
  resumeGame: 'Resume Game',
  resetChallenge: 'Reset Challenge',
  exitToMainMenu: 'Exit to Main Menu',
  left: 'Left',
  right: 'Right',
  drop: 'Drop',
  destruct: 'Destruct',
  rules: 'Rules',
  axiom: 'Close',
  playAgain: 'Play Again',
  playAgainShort: 'Again',
  matchSetup: 'Match Setup',
  newChallenge: 'New Challenge',
  prevLevel: 'Prev Level',
  prevLevelShort: 'Prev',
  nextLevel: 'Next Level',
  nextLevelShort: 'Next',
  congratulations: '\u{1F389} Conglaturations! \u{1F389}',
  systems: 'Systems',
  backToSystems: '\u2190 Systems',
  sideLeft: 'L',
  sideRight: 'R',
  randomConfig: 'Zen',
  formulaShape: 'Settings',
  size: 'Formula Length',
  connectives: 'Connectives',
  symbols: 'Symbols',
  negationWeight: 'Negation',
  implicationWeight: 'Implication',
  conjunctionWeight: 'Conjunction',
  disjunctionWeight: 'Disjunction',
  filter: 'Parameters',
  bypassPercent: 'Chaoticity (💀%)',
  targetNonStructural: 'Solution Size',
  continue: 'Continue',
  start: 'Start',
  back: 'Back',
  preview: 'Preview',
  moves: 'Moves',
  par: 'Par',
  points: 'Points',
  bonus: 'Bonus',
  done: 'Done',
  goal: 'Goal',
  statsTemplate:
    'Generated {formulas} formulas ({rate}/s), {tautologies} tautologies, {solved} solved. Updated {sinceUpdate}s ago.',
  challengeSetup: 'Challenge Setup',
  lemmaConfirm: 'Confirm',
  lemma: 'Claim',
  secret: 'Secret',
  gallery: 'Gallery',
  prevBranch: 'Prev',
  nextBranch: 'Next',
  versus: 'Versus',
  player1: 'Player 1',
  player2: 'Player 2',
  tie: 'Tie!',
  winsTemplate: '{player} wins!',
  skip: 'Skip',
  players: 'Players',
  matchLength: 'Match Length (min)',
  mouse: 'Mouse',
  keyboard: 'Keyboard',
  gamepad1: 'Gamepad 1',
  gamepad2: 'Gamepad 2',
  npc: 'NPC',
  tutorial: 'Tutorial',
  tutorialBasics: 'Basics',
  tutorialLogic: 'Consequences',
  tutorialAdvance: 'Next Topic',
  tutorialPrevious: 'Previous Topic',
  tutorialOneMore: 'One More Challenge',
  tutorialIdentity: 'Identity',
  tutorialConstants: 'Constants',
  tutorialExtras: 'Drop',
  tutorialShape1: 'Destruct',
  tutorialShape2: 'Side flip',
  tutorialShape3: 'Dividing',
  tutorialShape4: 'Branching',
  tutorialShape5: 'Shattering',
  tutorialOptimization: 'Optimization',
  tutorialClaims: 'Claim',
  tutorialSolvability: 'Solvability',
  tutorialSkipping: 'Skip',
  tutorialConjecture: 'Sandbox',
  tutorialOwlBasics:
    'Welcome to LK! In its challenges you close derivation trees built out of sequents. This first chapter teaches the essentials you need to play.',
  tutorialOwlLogic:
    'The second chapter walks through the consequences of dropping each connective ( → ∧ ∨ ¬ ) in different situations, one at a time. If you would rather jump straight into the deep end, you already know every move — feel free to head for the real game.',
  tutorialOwlClose:
    'A branch of the tree can be closed when the same sentence sits on both sides of the gate ( ⊢ ) — this situation is called an identity. You can switch branches with the {branch} buttons and close the chosen branch with the {close} button.',
  tutorialOwlCloseConstants:
    'Constant sentences can sometimes close a branch on their own — Falsum ( ⊥ ) when it sits alone on the left side of the gate, and Verum ( ⊤ ) when it sits alone on the right.',
  tutorialOwlDrop:
    'Any extra sentences on a branch must always be dropped before the branch can close. Remove them by picking the sentence to drop with the {pick} buttons, then pressing the {drop} button repeatedly until the picked sentence falls off the tree. If you drop a sentence the branch needs for closing, you can undo your move by pressing {undo}.',
  tutorialOwlSplit:
    'You can drop a connective by picking a sentence with the {pick} buttons, then pressing {destruct} repeatedly until the outermost connective of the picked sentence falls off the tree. Dropping a Conjunction ( ∧ ) on the left side of the gate, or a Disjunction ( ∨ ) on the right, causes no further consequences — the pieces stay where they were.',
  tutorialOwlSideFlip:
    'Dropping a Negation ( ¬ ) makes the remaining sentence move to the other side of the gate.',
  tutorialOwlCrossing:
    'Dropping an Implication ( → ) on the right side of the gate divides its parts across the two sides of the gate.',
  tutorialOwlBranching:
    'Dropping a Conjunction ( ∧ ) on the right side of the gate, or a Disjunction ( ∨ ) on the left, makes the tree branch.',
  tutorialOwlBranchingCrossing:
    'Dropping an Implication ( → ) on the left side of the gate shatters the sentence: the most intricate of the rules combines both the parts dividing across the gate and the tree branching.',
  tutorialOwlOptimization: 'The third chapter is about optimizing solutions.',
  tutorialOwlClaims:
    'You can add a claim to the selected branch by pressing the {lemma} button. Pick the parts of the sentence with the {pieces} buttons and finally press the {confirm} button. Claims never affect whether a challenge can be solved, but they can sometimes shorten the solution.',
  tutorialOwlSolvability:
    'The fourth chapter is about telling which challenges can be solved. Recognizing solvability matters if you take on chaotic ( 💀 ) challenges.',
  tutorialOwlUnsolvable:
    'The challenges here are deliberately unsolvable, so that you learn to recognize one. You can skip an unsolvable challenge by pressing the {skip} button.',
  tutorialOwlConjecture:
    'In this sandbox you can try to solve challenges of your own choosing. First pick the parts of the sentence with the {pieces} buttons, and finally press the {confirm} button. You can take back mispresses with the {undo} button.',
  tutorialSkipped: 'Challenge skipped! It had no solution.',
  tutorialSkippedSolvable: 'Challenge skipped! It did have a solution, though.',
  tutorialComplete: 'Graduation',
  tutorialDemoSequent: 'This is a sequent.',
  tutorialDemoGrow: 'Each move grows the tree.',
  tutorialDemoClosed: 'This branch is closed — it cannot grow.',
  tutorialDemoOther: "Let's close the other branch.",
  tutorialDemoDone: "The tree is done. Let's solve the next one together!",
  tutorialOwlPresolve: 'Let me help you get started.',
  tutorialStart: 'Start',
  tutorialOwlDone:
    'The tutorial is complete! You now know everything you need to play. Have fun!',
} as const

const fi: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Zen',
  campaign: 'Kampanja',
  menu: 'Valikko',
  undo: 'Kumoa',
  level: 'Taso',
  paused: 'Pysäytetty',
  resumeGame: 'Jatka peliä',
  resetChallenge: 'Aloita alusta',
  exitToMainMenu: 'Päävalikkoon',
  left: 'Vasen',
  right: 'Oikea',
  drop: 'Pudota',
  destruct: 'Pura',
  rules: 'Säännöt',
  axiom: 'Sulje',
  playAgain: 'Pelaa uudestaan',
  playAgainShort: 'Uudestaan',
  matchSetup: 'Ottelun asetukset',
  newChallenge: 'Uusi haaste',
  prevLevel: 'Edellinen',
  prevLevelShort: 'Edellinen',
  nextLevel: 'Seuraava',
  nextLevelShort: 'Seuraava',
  congratulations: '\u{1F389} Oneski olkoon! \u{1F389}',
  systems: 'Järjestelmät',
  backToSystems: '\u2190 Järjestelmät',
  sideLeft: 'V',
  sideRight: 'O',
  randomConfig: 'Zen',
  formulaShape: 'Asetukset',
  size: 'Kaavan pituus',
  connectives: 'Konnektiivit',
  symbols: 'Symbolit',
  negationWeight: 'Negaatio',
  implicationWeight: 'Implikaatio',
  conjunctionWeight: 'Konjunktio',
  disjunctionWeight: 'Disjunktio',
  filter: 'Parametrit',
  bypassPercent: 'Kaoottisuus (💀%)',
  targetNonStructural: 'Ratkaisun koko',
  continue: 'Jatka',
  start: 'Aloita',
  back: 'Takaisin',
  preview: 'Esikatselu',
  moves: 'Siirrot',
  par: 'Par',
  points: 'Pisteet',
  bonus: 'Bonus',
  done: 'Valmis',
  goal: 'Tavoite',
  statsTemplate:
    'Tuotettu {formulas} kaavaa ({rate}/s), {tautologies} tautologiaa, {solved} ratkaisua. Päivitetty {sinceUpdate}s sitten.',
  challengeSetup: 'Haasteen asetukset',
  lemmaConfirm: 'Vahvista',
  lemma: 'Väitä',
  secret: 'Salainen',
  gallery: 'Galleria',
  prevBranch: 'Edellinen',
  nextBranch: 'Seuraava',
  versus: 'Vastakkain',
  player1: 'Pelaaja 1',
  player2: 'Pelaaja 2',
  tie: 'Tasapeli!',
  winsTemplate: '{player} voitti!',
  skip: 'Ohita',
  players: 'Pelaajat',
  matchLength: 'Ottelun kesto (min)',
  mouse: 'Hiiri',
  keyboard: 'Näppäimistö',
  gamepad1: 'Ohjain 1',
  gamepad2: 'Ohjain 2',
  npc: 'NPC',
  tutorial: 'Opastus',
  tutorialBasics: 'Perusteet',
  tutorialLogic: 'Seuraamukset',
  tutorialAdvance: 'Seuraava aihe',
  tutorialPrevious: 'Edellinen aihe',
  tutorialOneMore: 'Vielä yksi haaste',
  tutorialIdentity: 'Identiteetti',
  tutorialConstants: 'Vakiot',
  tutorialExtras: 'Pudottaminen',
  tutorialShape1: 'Purkaminen',
  tutorialShape2: 'Puolenvaihto',
  tutorialShape3: 'Jakautuminen',
  tutorialShape4: 'Haarautuminen',
  tutorialShape5: 'Sirpaloituminen',
  tutorialOptimization: 'Optimointi',
  tutorialClaims: 'Väittäminen',
  tutorialSolvability: 'Ratkeavuus',
  tutorialSkipping: 'Ohittaminen',
  tutorialConjecture: 'Hiekkalaatikko',
  tutorialOwlBasics:
    'Tervetuloa pelaamaan LK:ta! Pelin haasteissa suljetaan sekventeistä koostuvia päättelypuita. Ensimmäisessä luvussa opimme pelaamisen kannalta välttämättömiä perusasioita.',
  tutorialOwlLogic:
    'Toisessa luvussa käydään yksitellen läpi eri konnektiivien ( → ∧ ∨ ¬ ) pudottamisen seuraamuksia eri tilanteissa. Mikäli haluat hypätä suoraan syvään päätyyn, osaat jo kaikki siirrot — voit siirtyä pelaamaan varsinaista peliä vaikka heti.',
  tutorialOwlClose:
    'Päättelypuun oksa on suljettavissa silloin, kun portin ( ⊢ ) kummallakin puolella on sama lause — tällaista tilannetta kutsutaan identiteetiksi. Voit vaihtaa oksaa {branch} painikkeilla ja sulkea valitun oksan {close} painikkeella.',
  tutorialOwlCloseConstants:
    'Vakiolauseet mahdollistavat joskus oksan sulkemisen yksinään — Falsum ( ⊥ ) ollessaan yksin portin vasemmalla puolella, ja Verum ( ⊤ ) ollessaan yksin portin oikealla puolella.',
  tutorialOwlDrop:
    'Oksan sisältämät ylimääräiset lauseet on aina pudotettava ennen kuin oksan voi sulkea. Saat ylimääräiset lauseet poistettua valitsemalla pudotettavan lauseen {pick} painikkeilla, ja painamalla sen jälkeen {drop} painiketta toistuvasti, kunnes valittu lause putoaa puusta. Mikäli pudotat oksan sulkemiseen tarvittavan lauseen, voit perua siirtosi painamalla {undo} painiketta.',
  tutorialOwlSplit:
    'Voit pudottaa konnektiivin valitsemalla lauseen {pick} painikkeilla, ja painamalla sen jälkeen {destruct} toistuvasti, kunnes valitun lauseen uloin konnektiivi putoaa puusta. Konjunktion ( ∧ ) pudottaminen portin vasemmalla puolella tai Disjunktion ( ∨ ) pudottaminen portin oikealla puolella ei aiheuta sen kummempia seuraamuksia — osat jäävät paikoilleen.',
  tutorialOwlSideFlip:
    'Negaation ( ¬ ) pudottaminen aiheuttaa jäljelle jäävän lauseen siirtymisen portin toiselle puolelle.',
  tutorialOwlCrossing:
    'Implikaation ( → ) pudottaminen portin oikealta puolelta aiheuttaa lauseen osien jakautumisen kahdelle puolelle porttia.',
  tutorialOwlBranching:
    'Konjunktion ( ∧ ) pudottaminen portin oikealla puolella tai Disjunktion ( ∨ ) pudottaminen portin vasemmalla puolella aiheuttaa puun haarautumisen.',
  tutorialOwlBranchingCrossing:
    'Implikaation ( → ) pudottaminen portin vasemmalta puolelta sirpaloittaa lauseen: säännöistä monimutkaisin yhdistää sekä osien jakautumisen portin eri puolille että puun haarautumisen.',
  tutorialOwlOptimization:
    'Kolmannessa luvussa tutustumme ratkaisujen optimointiin.',
  tutorialOwlClaims:
    'Voit lisätä valittuun oksaan väittämän painamalla {lemma} painiketta. Valitse lauseen osat {pieces} painikkeilla ja paina lopuksi {confirm} painiketta. Väittämät eivät vaikuta haasteen ratkeavuuteen, mutta ne voivat joskus lyhentää ratkaisua.',
  tutorialOwlSolvability:
    'Neljännessä luvussa pohdimme, millaiset haasteet ovat ratkeavia. Ratkeavuuden tunnistaminen on oleellista, mikäli koitat ratkaista kaoottisia ( 💀 ) haasteita.',
  tutorialOwlUnsolvable:
    'Loimme tähän tarkoituksella ratkeamattomia haasteita, jotta opit tunnistamaan sellaisen. Voit ohittaa ratkeamattoman haasteen painamalla {skip} painiketta.',
  tutorialOwlConjecture:
    'Hiekkalaatikossa voit kokeilla ratkaista vapaavalintaisia haasteita. Valitse ensin lauseen osat {pieces} painikkeilla ja paina lopuksi {confirm} painiketta. Virhepainallukset saat peruttua {undo} painikkeella.',
  tutorialSkipped: 'Haaste ohitettu! Sillä ei ollut ratkaisua.',
  tutorialSkippedSolvable:
    'Haaste ohitettu! Sillä olisi sittenkin ollut ratkaisu.',
  tutorialComplete: 'Valmistujaiset',
  tutorialDemoSequent: 'Tämä on sekventti.',
  tutorialDemoGrow: 'Jokainen siirto kasvattaa puuta.',
  tutorialDemoClosed: 'Tämä oksa on suljettu — se ei voi enää kasvaa.',
  tutorialDemoOther: 'Suljetaan toinenkin oksa.',
  tutorialDemoDone: 'Puu on valmis. Ratkaistaan seuraava yhdessä!',
  tutorialOwlPresolve: 'Autan sinut alkuun.',
  tutorialStart: 'Aloita',
  tutorialOwlDone:
    'Opastus on suoritettu! Tiedät nyt kaiken, mitä pelaamiseen tarvitaan. Pidä hauskaa!',
}

const es: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Zen',
  campaign: 'Campaña',
  menu: 'Menú',
  undo: 'Deshacer',
  level: 'Nivel',
  paused: 'Pausado',
  resumeGame: 'Reanudar juego',
  resetChallenge: 'Reiniciar desafío',
  exitToMainMenu: 'Salir al menú principal',
  left: 'Izquierda',
  right: 'Derecha',
  drop: 'Soltar',
  destruct: 'Destruir',
  rules: 'Reglas',
  axiom: 'Cerrar',
  playAgain: 'Jugar de nuevo',
  playAgainShort: 'De nuevo',
  matchSetup: 'Configuración de partida',
  newChallenge: 'Nuevo desafío',
  prevLevel: 'Nivel anterior',
  prevLevelShort: 'Anterior',
  nextLevel: 'Siguiente nivel',
  nextLevelShort: 'Siguiente',
  congratulations: '\u{1F389} ¡Felicidades! \u{1F389}',
  systems: 'Sistemas',
  backToSystems: '\u2190 Sistemas',
  sideLeft: 'I',
  sideRight: 'D',
  randomConfig: 'Zen',
  formulaShape: 'Ajustes',
  size: 'Longitud de fórmula',
  connectives: 'Conectivos',
  symbols: 'Símbolos',
  negationWeight: 'Negación',
  implicationWeight: 'Implicación',
  conjunctionWeight: 'Conjunción',
  disjunctionWeight: 'Disyunción',
  filter: 'Parámetros',
  bypassPercent: 'Caoticidad (💀%)',
  targetNonStructural: 'Tamaño de solución',
  continue: 'Continuar',
  start: 'Comenzar',
  back: 'Atrás',
  preview: 'Vista previa',
  moves: 'Movimientos',
  par: 'Par',
  points: 'Puntos',
  bonus: 'Bonus',
  done: 'Hecho',
  goal: 'Objetivo',
  statsTemplate:
    'Generadas {formulas} fórmulas ({rate}/s), {tautologies} tautologías, {solved} resueltas. Actualizado hace {sinceUpdate}s.',
  challengeSetup: 'Configuración del desafío',
  lemmaConfirm: 'Confirmar',
  lemma: 'Afirmar',
  secret: 'Secreto',
  gallery: 'Galería',
  prevBranch: 'Anterior',
  nextBranch: 'Siguiente',
  versus: 'Versus',
  player1: 'Jugador 1',
  player2: 'Jugador 2',
  tie: '¡Empate!',
  winsTemplate: '¡{player} gana!',
  skip: 'Saltar',
  players: 'Jugadores',
  matchLength: 'Duración (min)',
  mouse: 'Ratón',
  keyboard: 'Teclado',
  gamepad1: 'Mando 1',
  gamepad2: 'Mando 2',
  npc: 'NPC',
  tutorial: 'Tutorial',
  tutorialBasics: 'Fundamentos',
  tutorialLogic: 'Consecuencias',
  tutorialAdvance: 'Siguiente tema',
  tutorialPrevious: 'Tema anterior',
  tutorialOneMore: 'Un desafío más',
  tutorialIdentity: 'Identidad',
  tutorialConstants: 'Constantes',
  tutorialExtras: 'Soltar',
  tutorialShape1: 'Destruir',
  tutorialShape2: 'Cambio de lado',
  tutorialShape3: 'Reparto',
  tutorialShape4: 'Ramificación',
  tutorialShape5: 'Fragmentación',
  tutorialOptimization: 'Optimización',
  tutorialClaims: 'Afirmar',
  tutorialSolvability: 'Resolubilidad',
  tutorialSkipping: 'Saltar',
  tutorialConjecture: 'Arenero',
  tutorialOwlBasics:
    '¡Bienvenido a LK! En los desafíos del juego se cierran árboles de deducción compuestos de secuentes. En este primer capítulo aprendemos lo básico imprescindible para jugar.',
  tutorialOwlLogic:
    'El segundo capítulo repasa una a una las consecuencias de soltar cada conectivo ( → ∧ ∨ ¬ ) en distintas situaciones. Si prefieres lanzarte a lo hondo, ya conoces todos los movimientos: puedes pasar directamente al juego de verdad.',
  tutorialOwlClose:
    'Una rama del árbol se puede cerrar cuando a ambos lados de la puerta ( ⊢ ) está la misma oración — esta situación se llama identidad. Puedes cambiar de rama con los botones {branch} y cerrar la rama elegida con el botón {close}.',
  tutorialOwlCloseConstants:
    'Las oraciones constantes a veces permiten cerrar una rama por sí solas: Falsum ( ⊥ ) cuando está solo a la izquierda de la puerta, y Verum ( ⊤ ) cuando está solo a la derecha.',
  tutorialOwlDrop:
    'Las oraciones sobrantes de una rama deben soltarse siempre antes de poder cerrarla. Elimínalas eligiendo la oración a soltar con los botones {pick} y pulsando después el botón {drop} repetidamente, hasta que la oración elegida caiga del árbol. Si sueltas una oración necesaria para cerrar la rama, puedes deshacer el movimiento pulsando {undo}.',
  tutorialOwlSplit:
    'Puedes soltar un conectivo eligiendo una oración con los botones {pick} y pulsando después {destruct} repetidamente, hasta que el conectivo más externo de la oración elegida caiga del árbol. Soltar una Conjunción ( ∧ ) en el lado izquierdo de la puerta, o una Disyunción ( ∨ ) en el derecho, no tiene mayores consecuencias: las piezas se quedan donde estaban.',
  tutorialOwlSideFlip:
    'Soltar una Negación ( ¬ ) hace que la oración restante pase al otro lado de la puerta.',
  tutorialOwlCrossing:
    'Soltar una Implicación ( → ) en el lado derecho de la puerta reparte sus partes entre los dos lados de la puerta.',
  tutorialOwlBranching:
    'Soltar una Conjunción ( ∧ ) en el lado derecho de la puerta, o una Disyunción ( ∨ ) en el izquierdo, ramifica el árbol.',
  tutorialOwlBranchingCrossing:
    'Soltar una Implicación ( → ) en el lado izquierdo de la puerta fragmenta la oración: la regla más compleja combina el reparto de las partes entre ambos lados y la ramificación del árbol.',
  tutorialOwlOptimization:
    'El tercer capítulo trata de optimizar las soluciones.',
  tutorialOwlClaims:
    'Puedes añadir una afirmación a la rama elegida pulsando el botón {lemma}. Elige las partes de la oración con los botones {pieces} y pulsa al final el botón {confirm}. Las afirmaciones nunca afectan a la resolubilidad del desafío, pero a veces pueden acortar la solución.',
  tutorialOwlSolvability:
    'En el cuarto capítulo consideramos qué desafíos tienen solución. Reconocer la resolubilidad es esencial si intentas resolver desafíos caóticos ( 💀 ).',
  tutorialOwlUnsolvable:
    'Aquí hemos creado a propósito desafíos irresolubles, para que aprendas a reconocerlos. Puedes saltar un desafío irresoluble pulsando el botón {skip}.',
  tutorialOwlConjecture:
    'En este arenero puedes intentar resolver desafíos de tu propia elección. Elige primero las partes de la oración con los botones {pieces} y pulsa al final el botón {confirm}. Puedes deshacer las pulsaciones erróneas con el botón {undo}.',
  tutorialSkipped: '¡Desafío saltado! No tenía solución.',
  tutorialSkippedSolvable: '¡Desafío saltado! Sin embargo, sí tenía solución.',
  tutorialComplete: 'Graduación',
  tutorialDemoSequent: 'Esto es un secuente.',
  tutorialDemoGrow: 'Cada movimiento hace crecer el árbol.',
  tutorialDemoClosed: 'Esta rama está cerrada: ya no puede crecer.',
  tutorialDemoOther: 'Cerremos la otra rama.',
  tutorialDemoDone: 'El árbol está listo. ¡Resolvamos el siguiente juntos!',
  tutorialOwlPresolve: 'Deja que te ayude a empezar.',
  tutorialStart: 'Empezar',
  tutorialOwlDone:
    '¡Tutorial completado! Ya sabes todo lo que necesitas para jugar. ¡Diviértete!',
}

const cs: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Zen',
  campaign: 'Kampaň',
  menu: 'Menu',
  undo: 'Zpět',
  level: 'Úroveň',
  paused: 'Pozastaveno',
  resumeGame: 'Pokračovat',
  resetChallenge: 'Restartovat výzvu',
  exitToMainMenu: 'Zpět do hlavního menu',
  left: 'Vlevo',
  right: 'Vpravo',
  drop: 'Pustit',
  destruct: 'Zničit',
  rules: 'Pravidla',
  axiom: 'Zavřít',
  playAgain: 'Hrát znovu',
  playAgainShort: 'Znovu',
  matchSetup: 'Nastavení zápasu',
  newChallenge: 'Nová výzva',
  prevLevel: 'Předchozí úroveň',
  prevLevelShort: 'Předchozí',
  nextLevel: 'Další úroveň',
  nextLevelShort: 'Další',
  congratulations: '\u{1F389} Gratulujeme! \u{1F389}',
  systems: 'Systémy',
  backToSystems: '\u2190 Systémy',
  sideLeft: 'L',
  sideRight: 'P',
  randomConfig: 'Zen',
  formulaShape: 'Nastavení',
  size: 'Délka formule',
  connectives: 'Spojky',
  symbols: 'Symboly',
  negationWeight: 'Negace',
  implicationWeight: 'Implikace',
  conjunctionWeight: 'Konjunkce',
  disjunctionWeight: 'Disjunkce',
  filter: 'Parametry',
  bypassPercent: 'Chaos (💀%)',
  targetNonStructural: 'Velikost řešení',
  continue: 'Pokračovat',
  start: 'Start',
  back: 'Zpět',
  preview: 'Náhled',
  moves: 'Tahy',
  par: 'Par',
  points: 'Body',
  bonus: 'Bonus',
  done: 'Hotovo',
  goal: 'Cíl',
  statsTemplate:
    'Vygenerováno {formulas} formulí ({rate}/s), {tautologies} tautologií, {solved} vyřešeno. Aktualizováno před {sinceUpdate}s.',
  challengeSetup: 'Nastavení výzvy',
  lemmaConfirm: 'Potvrdit',
  lemma: 'Tvrdit',
  secret: 'Tajné',
  gallery: 'Galerie',
  prevBranch: 'Předchozí',
  nextBranch: 'Další',
  versus: 'Versus',
  player1: 'Hráč 1',
  player2: 'Hráč 2',
  tie: 'Remíza!',
  winsTemplate: '{player} vyhrává!',
  skip: 'Přeskočit',
  players: 'Hráči',
  matchLength: 'Délka zápasu (min)',
  mouse: 'Myš',
  keyboard: 'Klávesnice',
  gamepad1: 'Ovladač 1',
  gamepad2: 'Ovladač 2',
  npc: 'NPC',
  tutorial: 'Návod',
  tutorialBasics: 'Základy',
  tutorialLogic: 'Důsledky',
  tutorialAdvance: 'Další téma',
  tutorialPrevious: 'Předchozí téma',
  tutorialOneMore: 'Ještě jedna výzva',
  tutorialIdentity: 'Identita',
  tutorialConstants: 'Konstanty',
  tutorialExtras: 'Pouštění',
  tutorialShape1: 'Ničení',
  tutorialShape2: 'Změna strany',
  tutorialShape3: 'Rozdělení',
  tutorialShape4: 'Větvení',
  tutorialShape5: 'Tříštění',
  tutorialOptimization: 'Optimalizace',
  tutorialClaims: 'Tvrzení',
  tutorialSolvability: 'Řešitelnost',
  tutorialSkipping: 'Přeskakování',
  tutorialConjecture: 'Pískoviště',
  tutorialOwlBasics:
    'Vítej ve hře LK! V jejích výzvách se zavírají odvozovací stromy složené ze sekventů. V této první kapitole se naučíme základy, bez kterých se hrát nedá.',
  tutorialOwlLogic:
    'Druhá kapitola probírá jeden po druhém důsledky puštění jednotlivých spojek ( → ∧ ∨ ¬ ) v různých situacích. Chceš-li skočit rovnou do hlubin, všechny tahy už znáš — můžeš přejít ke skutečné hře hned.',
  tutorialOwlClose:
    'Větev stromu lze zavřít, když na obou stranách brány ( ⊢ ) stojí stejná věta — takové situaci se říká identita. Větev přepneš tlačítky {branch} a vybranou větev zavřeš tlačítkem {close}.',
  tutorialOwlCloseConstants:
    'Konstantní věty někdy dokážou zavřít větev samy — Falsum ( ⊥ ), když stojí samo vlevo od brány, a Verum ( ⊤ ), když stojí samo vpravo.',
  tutorialOwlDrop:
    'Přebytečné věty na větvi je vždy nutné pustit, než ji lze zavřít. Odstraníš je tak, že tlačítky {pick} vybereš větu k puštění a pak opakovaně mačkáš tlačítko {drop}, dokud vybraná věta nespadne ze stromu. Pokud pustíš větu potřebnou k zavření větve, můžeš tah vrátit tlačítkem {undo}.',
  tutorialOwlSplit:
    'Spojku pustíš tak, že tlačítky {pick} vybereš větu a pak opakovaně mačkáš {destruct}, dokud vnější spojka vybrané věty nespadne ze stromu. Puštění Konjunkce ( ∧ ) na levé straně brány nebo Disjunkce ( ∨ ) na pravé nemá žádné zvláštní následky — části zůstávají na místě.',
  tutorialOwlSideFlip:
    'Puštění Negace ( ¬ ) přesune zbývající větu na druhou stranu brány.',
  tutorialOwlCrossing:
    'Puštění Implikace ( → ) na pravé straně brány rozdělí její části na obě strany brány.',
  tutorialOwlBranching:
    'Puštění Konjunkce ( ∧ ) na pravé straně brány nebo Disjunkce ( ∨ ) na levé rozvětví strom.',
  tutorialOwlBranchingCrossing:
    'Puštění Implikace ( → ) na levé straně brány větu roztříští: nejsložitější z pravidel spojuje jak rozdělení částí na obě strany brány, tak větvení stromu.',
  tutorialOwlOptimization: 'Třetí kapitola se věnuje optimalizaci řešení.',
  tutorialOwlClaims:
    'Na vybranou větev můžeš přidat tvrzení tlačítkem {lemma}. Vyber části věty tlačítky {pieces} a nakonec stiskni tlačítko {confirm}. Tvrzení nikdy neovlivní řešitelnost výzvy, ale někdy mohou řešení zkrátit.',
  tutorialOwlSolvability:
    'Ve čtvrté kapitole se zamýšlíme nad tím, jaké výzvy jsou řešitelné. Rozpoznat řešitelnost je zásadní, pokud se pustíš do chaotických ( 💀 ) výzev.',
  tutorialOwlUnsolvable:
    'Zde jsme záměrně vytvořili neřešitelné výzvy, ať se naučíš takovou rozpoznat. Neřešitelnou výzvu můžeš přeskočit tlačítkem {skip}.',
  tutorialOwlConjecture:
    'Na tomto pískovišti si můžeš zkusit vyřešit výzvy podle vlastní volby. Nejprve vyber části věty tlačítky {pieces} a nakonec stiskni tlačítko {confirm}. Chybná stisknutí vrátíš tlačítkem {undo}.',
  tutorialSkipped: 'Výzva přeskočena! Neměla řešení.',
  tutorialSkippedSolvable: 'Výzva přeskočena! Řešení ale měla.',
  tutorialComplete: 'Promoce',
  tutorialDemoSequent: 'Tohle je sekvent.',
  tutorialDemoGrow: 'Každým tahem strom roste.',
  tutorialDemoClosed: 'Tato větev je uzavřená — už nemůže růst.',
  tutorialDemoOther: 'Zavřeme i druhou větev.',
  tutorialDemoDone: 'Strom je hotový. Další vyřešíme spolu!',
  tutorialOwlPresolve: 'Pomůžu ti začít.',
  tutorialStart: 'Začít',
  tutorialOwlDone:
    'Návod je u konce! Teď víš vše, co ke hraní potřebuješ. Bav se!',
}

const pl: Record<MessageKey, string> = {
  title: 'LK',
  random: 'Zen',
  campaign: 'Kampania',
  menu: 'Menu',
  undo: 'Cofnij',
  level: 'Poziom',
  paused: 'Pauza',
  resumeGame: 'Wznów grę',
  resetChallenge: 'Zresetuj wyzwanie',
  exitToMainMenu: 'Wyjdź do menu głównego',
  left: 'Lewo',
  right: 'Prawo',
  drop: 'Upuść',
  destruct: 'Zniszcz',
  rules: 'Zasady',
  axiom: 'Zamknij',
  playAgain: 'Zagraj ponownie',
  playAgainShort: 'Ponownie',
  matchSetup: 'Ustawienia meczu',
  newChallenge: 'Nowe wyzwanie',
  prevLevel: 'Poprzedni poziom',
  prevLevelShort: 'Poprz.',
  nextLevel: 'Następny poziom',
  nextLevelShort: 'Nast.',
  congratulations: '\u{1F389} Gratulacje! \u{1F389}',
  systems: 'Systemy',
  backToSystems: '\u2190 Systemy',
  sideLeft: 'L',
  sideRight: 'P',
  randomConfig: 'Zen',
  formulaShape: 'Ustawienia',
  size: 'Długość formuły',
  connectives: 'Spójniki',
  symbols: 'Symbole',
  negationWeight: 'Negacja',
  implicationWeight: 'Implikacja',
  conjunctionWeight: 'Koniunkcja',
  disjunctionWeight: 'Alternatywa',
  filter: 'Parametry',
  bypassPercent: 'Chaos (💀%)',
  targetNonStructural: 'Rozmiar rozwiązania',
  continue: 'Kontynuuj',
  start: 'Start',
  back: 'Powrót',
  preview: 'Podgląd',
  moves: 'Ruchy',
  par: 'Par',
  points: 'Punkty',
  bonus: 'Bonus',
  done: 'Gotowe',
  goal: 'Cel',
  statsTemplate:
    'Wygenerowano {formulas} formuł ({rate}/s), {tautologies} tautologii, {solved} rozwiązanych. Zaktualizowano {sinceUpdate}s temu.',
  challengeSetup: 'Ustawienia wyzwania',
  lemmaConfirm: 'Zatwierdź',
  lemma: 'Twierdź',
  secret: 'Tajne',
  gallery: 'Galeria',
  prevBranch: 'Poprzedni',
  nextBranch: 'Następny',
  versus: 'Versus',
  player1: 'Gracz 1',
  player2: 'Gracz 2',
  tie: 'Remis!',
  winsTemplate: '{player} wygrywa!',
  skip: 'Pomiń',
  players: 'Gracze',
  matchLength: 'Czas meczu (min)',
  mouse: 'Mysz',
  keyboard: 'Klawiatura',
  gamepad1: 'Pad 1',
  gamepad2: 'Pad 2',
  npc: 'NPC',
  tutorial: 'Samouczek',
  tutorialBasics: 'Podstawy',
  tutorialLogic: 'Skutki',
  tutorialAdvance: 'Następny temat',
  tutorialPrevious: 'Poprzedni temat',
  tutorialOneMore: 'Jeszcze jedno wyzwanie',
  tutorialIdentity: 'Tożsamość',
  tutorialConstants: 'Stałe',
  tutorialExtras: 'Upuszczanie',
  tutorialShape1: 'Niszczenie',
  tutorialShape2: 'Zmiana strony',
  tutorialShape3: 'Rozdzielenie',
  tutorialShape4: 'Rozgałęzienie',
  tutorialShape5: 'Rozbicie',
  tutorialOptimization: 'Optymalizacja',
  tutorialClaims: 'Twierdzenie',
  tutorialSolvability: 'Rozwiązywalność',
  tutorialSkipping: 'Pomijanie',
  tutorialConjecture: 'Piaskownica',
  tutorialOwlBasics:
    'Witaj w grze LK! W jej wyzwaniach zamyka się drzewa wnioskowania zbudowane z sekwentów. W tym pierwszym rozdziale poznajemy podstawy niezbędne do gry.',
  tutorialOwlLogic:
    'Drugi rozdział omawia po kolei skutki upuszczania poszczególnych spójników ( → ∧ ∨ ¬ ) w różnych sytuacjach. Jeśli wolisz skoczyć na głęboką wodę, znasz już wszystkie ruchy — możesz przejść do właściwej gry od razu.',
  tutorialOwlClose:
    'Gałąź drzewa można zamknąć, gdy po obu stronach bramy ( ⊢ ) stoi to samo zdanie — taką sytuację nazywamy tożsamością. Gałąź zmieniasz przyciskami {branch}, a wybraną gałąź zamykasz przyciskiem {close}.',
  tutorialOwlCloseConstants:
    'Zdania stałe czasem pozwalają zamknąć gałąź samodzielnie — Falsum ( ⊥ ), gdy stoi samo po lewej stronie bramy, i Verum ( ⊤ ), gdy stoi samo po prawej.',
  tutorialOwlDrop:
    'Zbędne zdania na gałęzi trzeba zawsze upuścić, zanim da się ją zamknąć. Usuniesz je, wybierając zdanie do upuszczenia przyciskami {pick}, a następnie naciskając przycisk {drop} wielokrotnie, aż wybrane zdanie spadnie z drzewa. Jeśli upuścisz zdanie potrzebne do zamknięcia gałęzi, możesz cofnąć ruch przyciskiem {undo}.',
  tutorialOwlSplit:
    'Spójnik upuszczasz, wybierając zdanie przyciskami {pick}, a następnie naciskając {destruct} wielokrotnie, aż zewnętrzny spójnik wybranego zdania spadnie z drzewa. Upuszczenie Koniunkcji ( ∧ ) po lewej stronie bramy lub Alternatywy ( ∨ ) po prawej nie ma szczególnych następstw — części zostają na miejscu.',
  tutorialOwlSideFlip:
    'Upuszczenie Negacji ( ¬ ) przenosi pozostałe zdanie na drugą stronę bramy.',
  tutorialOwlCrossing:
    'Upuszczenie Implikacji ( → ) po prawej stronie bramy rozdziela jej części na obie strony bramy.',
  tutorialOwlBranching:
    'Upuszczenie Koniunkcji ( ∧ ) po prawej stronie bramy lub Alternatywy ( ∨ ) po lewej rozgałęzia drzewo.',
  tutorialOwlBranchingCrossing:
    'Upuszczenie Implikacji ( → ) po lewej stronie bramy rozbija zdanie: najbardziej złożona z reguł łączy rozdzielenie części na obie strony bramy i rozgałęzienie drzewa.',
  tutorialOwlOptimization: 'Trzeci rozdział dotyczy optymalizacji rozwiązań.',
  tutorialOwlClaims:
    'Do wybranej gałęzi możesz dodać twierdzenie przyciskiem {lemma}. Wybierz części zdania przyciskami {pieces}, a na końcu naciśnij przycisk {confirm}. Twierdzenia nigdy nie wpływają na rozwiązywalność wyzwania, ale czasem mogą skrócić rozwiązanie.',
  tutorialOwlSolvability:
    'W czwartym rozdziale zastanawiamy się, jakie wyzwania da się rozwiązać. Rozpoznawanie rozwiązywalności jest istotne, jeśli mierzysz się z chaotycznymi ( 💀 ) wyzwaniami.',
  tutorialOwlUnsolvable:
    'Umieściliśmy tu celowo nierozwiązywalne wyzwania, dzięki czemu nauczysz się je rozpoznawać. Nierozwiązywalne wyzwanie możesz pominąć przyciskiem {skip}.',
  tutorialOwlConjecture:
    'W tej piaskownicy możesz spróbować rozwiązać wyzwania własnego wyboru. Najpierw wybierz części zdania przyciskami {pieces}, a na końcu naciśnij przycisk {confirm}. Błędne naciśnięcia cofniesz przyciskiem {undo}.',
  tutorialSkipped: 'Wyzwanie pominięte! Nie miało rozwiązania.',
  tutorialSkippedSolvable: 'Wyzwanie pominięte! Miało jednak rozwiązanie.',
  tutorialComplete: 'Zakończenie',
  tutorialDemoSequent: 'To jest sekwent.',
  tutorialDemoGrow: 'Z każdym ruchem drzewo rośnie.',
  tutorialDemoClosed: 'Ta gałąź jest zamknięta — już nie urośnie.',
  tutorialDemoOther: 'Zamknijmy drugą gałąź.',
  tutorialDemoDone: 'Drzewo jest gotowe. Rozwiążmy następne razem!',
  tutorialOwlPresolve: 'Pomogę ci zacząć.',
  tutorialStart: 'Rozpocznij',
  tutorialOwlDone:
    'Samouczek ukończony! Wiesz już wszystko, czego potrzeba do gry. Miłej zabawy!',
}

export type MessageKey = keyof typeof en

const messages: Record<string, Record<MessageKey, string>> = {
  cs,
  en,
  es,
  fi,
  pl,
}

const detectLocale = (): string => {
  const lang = navigator.language.split('-')[0] ?? 'en'
  return lang in messages ? lang : 'en'
}

const systemLocale = detectLocale()
let locale = systemLocale

export const setLocale = (raw: string | null): void => {
  if (raw === null || raw === '') return
  const normalized = raw.replace(/_/g, '-').split('-')[0]?.toLowerCase()
  if (normalized !== undefined && normalized in messages) locale = normalized
}

export const getLocale = (): string => locale

export const getSystemLocale = (): string => systemLocale

export const availableLocales: ReadonlyArray<string> = Object.keys(messages)

const endonyms: Record<string, string> = {
  cs: 'Čeština',
  en: 'English',
  es: 'Español',
  fi: 'Suomi',
  pl: 'Polski',
}

export const endonymOf = (code: string): string => endonyms[code] ?? code

let rerenderHook: () => void = () => {}

export const onLocaleChange = (hook: () => void): void => {
  rerenderHook = hook
}

export const changeLanguage = (raw: string): void => {
  setLocale(raw)
  const params = new URLSearchParams(window.location.search)
  params.set('lang', locale)
  history.replaceState(history.state, '', `?${params.toString()}`)
  rerenderHook()
}

export const clearLangOverride = (): void => {
  locale = systemLocale
  const params = new URLSearchParams(window.location.search)
  params.delete('lang')
  const qs = params.toString()
  history.replaceState(
    history.state,
    '',
    qs ? `?${qs}` : window.location.pathname,
  )
  rerenderHook()
}

export const t = (key: MessageKey): string =>
  (messages[locale] ?? en)[key] ?? en[key]

type StatsParams = {
  formulas: number
  rate: string
  tautologies: number
  solved: number
  sinceUpdate: string
}

export const formatStats = (p: StatsParams): string => {
  const values: Record<string, string | number> = {
    formulas: p.formulas,
    rate: p.rate,
    tautologies: p.tautologies,
    solved: p.solved,
    sinceUpdate: p.sinceUpdate,
  }
  return t('statsTemplate').replace(/\{(\w+)\}/g, (_, key) =>
    String(values[key] ?? `{${key}}`),
  )
}
