from pytest_bdd import given, scenarios, then, when

from server.app.game import GameManager

scenarios("../features/turns.feature")
scenarios("../features/placement.feature")
scenarios("../features/victory.feature")
scenarios("../features/lobby.feature")
scenarios("../features/reconnect.feature")


@given("a battle game with two players", target_fixture="battle_game")
def battle_game():
    ctx = {}
    game = GameManager()
    player_a = game.add_player("A")
    player_b = game.add_player("B")

    # Force ready and placement to reach battle quickly.
    game.state.players[player_a].ready = True
    game.state.players[player_b].ready = True
    game._start_placement()

    for pos in [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1)]:
        game.place_base(player_a, pos)
    for pos in [(2, 0), (2, 1), (2, 2), (1, 2), (1, 3)]:
        game.place_base(player_b, pos)

    if game.state.phase != "battle":
        game._start_battle()

    game.state.turn_player_id = player_a

    ctx["game"] = game
    ctx["player_a"] = player_a
    ctx["player_b"] = player_b
    ctx["message"] = None
    return ctx


@given("a placement game with two players", target_fixture="placement_game")
def placement_game():
    ctx = {}
    game = GameManager()
    player_a = game.add_player("A")
    player_b = game.add_player("B")

    game.state.players[player_a].ready = True
    game.state.players[player_b].ready = True
    game._start_placement()

    ctx["game"] = game
    ctx["player_a"] = player_a
    ctx["player_b"] = player_b
    return ctx


@given("a lobby game with two players", target_fixture="lobby_game")
def lobby_game():
    ctx = {}
    game = GameManager()
    player_a = game.add_player("A")
    player_b = game.add_player("B")
    ctx["game"] = game
    ctx["player_a"] = player_a
    ctx["player_b"] = player_b
    return ctx


@given("it is player B's turn")
def set_player_b_turn(battle_game):
    battle_game["game"].state.turn_player_id = battle_game["player_b"]


@given("player B has a single base at position 0 0")
def enemy_single_base(battle_game):
    game = battle_game["game"]
    player_b = battle_game["player_b"]
    game.state.bases[player_b] = {(0, 0)}


@given("player A normal shot is fixed to position 0 0")
def fixed_normal_shot(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    game.state.normal_candidates[player_a] = {(0, 0)}


@when("player A performs a normal shot")
def player_a_normal_shot(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    message, _ = game.shot(player_a, "normal")
    battle_game["message"] = message


@when("player A places 5 bases")
def player_a_places_5(placement_game):
    game = placement_game["game"]
    player_a = placement_game["player_a"]
    for pos in [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1)]:
        game.place_base(player_a, pos)


@when("player B places 5 bases")
def player_b_places_5(placement_game):
    game = placement_game["game"]
    player_b = placement_game["player_b"]
    for pos in [(2, 0), (2, 1), (2, 2), (1, 2), (1, 3)]:
        game.place_base(player_b, pos)


@then('the action should be rejected with "Nao e seu turno"')
def action_rejected_turn(battle_game):
    assert battle_game["message"] == "Nao e seu turno"


@then('the game phase should be "battle"')
def phase_is_battle(placement_game):
    assert placement_game["game"].state.phase == "battle"


@when("player A marks ready")
def player_a_ready(lobby_game):
    game = lobby_game["game"]
    game.set_ready(lobby_game["player_a"], True)


@when("player B marks ready")
def player_b_ready(lobby_game):
    game = lobby_game["game"]
    game.set_ready(lobby_game["player_b"], True)


@then('the game phase should be "placement"')
def phase_is_placement(lobby_game):
    assert lobby_game["game"].state.phase == "placement"


@then('the game phase should be "ended"')
def phase_is_ended(battle_game):
    assert battle_game["game"].state.phase == "ended"


@then("the winner should be player A")
def winner_is_player_a(battle_game):
    game = battle_game["game"]
    assert game.state.winner_id == battle_game["player_a"]


@when("player A disconnects")
def player_a_disconnects(battle_game):
    game = battle_game["game"]
    game.disconnect_player(battle_game["player_a"])


@when("player A reconnects")
def player_a_reconnects(battle_game):
    game = battle_game["game"]
    game.reconnect_player(battle_game["player_a"])


@then("player A should be offline")
def player_a_offline(battle_game):
    game = battle_game["game"]
    assert game.state.players[battle_game["player_a"]].connected is False


@then("player A should be online")
def player_a_online(battle_game):
    game = battle_game["game"]
    assert game.state.players[battle_game["player_a"]].connected is True
