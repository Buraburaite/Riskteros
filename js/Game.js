function Game() {

  //Private
  let round = 0; //Increment with newRound(), never change directly.

  //Public
  const inst = {
    god : $({}),
    mapEl : $('.map-container'),
    marchArmies : marchArmies,
    newRound : newRound,
    players : [],
    placeArmies : placeArmies,
    raven : null,
    startGame : startGame,
    waypoints : null,

    get round() { return round; },
    set round(newRound) { round = newRound; this.god.trigger('worldUpdate', round); } //for testing purposes only
  };
  // Conversion methods for strings to waypoints or player
  const toPlayer   = (stringName) => inst.players  .find((p)  => stringName  === p.name);
  const toWaypoint = (stringName) => inst.waypoints.find((wp) => stringName  === wp.name);


  function startGame() {

    //Set up the raven (our model)
    inst.raven = Raven(inst);

    //Create our waypoints
    inst.waypoints = createWaypoints(inst);


    inst.players.push(Player('Javi', 'Targaryen'));
    inst.players.push(Player('Durkee', 'Baratheon'));

    placeArmiesRound0('Javi', 'Lys', 10); //special version of placeArmies for Round 0
    placeArmiesRound0('Durkee', 'Myr', 10);

    //Start Turn 1
    newRound();
  }

  function newRound() {
    round++;
    inst.raven.newRound(round);
    inst.god.trigger('worldUpdate', round);
  }

  function placeArmiesRound0(player, dest, num = 1) {
    //Type checking and conversion
    if (typeof player === 'string') { player = toPlayer(player); }
    if (typeof dest   === 'string') { dest   = toWaypoint(dest); }

    dest.residingPlayer = player;
    dest.armyCount = num;
  }

  function placeArmies(player, dest, num = 1) {
    //Type checking and conversion
    if (typeof player === 'string') { player = toPlayer(player); }
    if (typeof dest   === 'string') { dest   = toWaypoint(dest); }

    //Place armies
      if (dest.residingPlayer === player) { dest.armyCount += num; }
      else { return console.log("Error: Game.placeArmies"); }
    }

  function marchArmies(origin, dest, marchingNum) {
    //Type checking and conversion, assuming either string name or Waypoint
    if (typeof origin === 'string') { origin = toWaypoint(origin); }
    if (typeof dest   === 'string') { dest   = toWaypoint(dest); }

    // If origin does no belong to a player, throw an "error"
    if (origin.residingPlayer === null) { return console.log("Error: Game.marchArmies"); }

    // If a valid number of armies then send that many, otherwise send all but one
    marchingNum = (marchingNum) ? marchingNum : origin.armyCount - 1;

    // Remove the number of marching armies from the origin
    origin.armyCount -= marchingNum;

    // If attacker left not armies in origin, they abandon origin
    if (!origin.armyCount) {
      origin.residingPlayer = null;
      origin.armyCount = 1;
    }

    //Check if moving would cause a problem
    const goingToAlliedTerritory = (origin.residingPlayer === dest.residingPlayer);

    if (goingToAlliedTerritory) {
      dest.armyCount += marchingNum;
    }
    else {
      //== The invading armies arrive, and the battle begins! ==//

      // First, find the number of armies available for attack and defense...
      let totalAttackers = marchingNum;
      let totalDefenders = dest.armyCount;
      // (...going to use this later...)
      const calcDiceRoll = () => Math.floor(Math.random() * (6) + 1);

      // ...and while either side still has armies...
      while (totalAttackers && totalDefenders) {

        // ...figure out how many armies will roll dice...
        let attackingNum = (totalAttackers >= 3) ? 3 : totalAttackers;
        let defendingNum = (totalDefenders >= 2) ? 2 : totalDefenders;

        // ...figure out what they rolled, ordered greatest first...
        attackDice = new Array(attackingNum).fill(0).map(calcDiceRoll).sort().reverse();
        defendDice = new Array(defendingNum).fill(0).map(calcDiceRoll).sort().reverse();

        // ...remove the casualties from the respective total...
        for (let i = 0; i < Math.min(attackDice.length, defendDice.length); i++) {
          if (attackDice[i] > defendDice[i]) { totalDefenders--; }
          else                               { totalAttackers--; }
        }

        // ...and repeat until one side is vanquished.
      }

      // If attack was succesful, exchange ownership of waypoint and occupy
      if (totalAttackers) {
        dest.residingPlayer = origin.residingPlayer;
        dest.armyCount = totalAttackers;
      }
      else {
        // Else, update dest with the number of survivors
        dest.armyCount = totalDefenders;
      }
      //== The battle has concluded, but war...war never changes... ==//
    }
  }


  return inst;
}
