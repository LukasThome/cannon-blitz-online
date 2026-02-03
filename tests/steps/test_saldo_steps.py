from pytest_bdd import given, scenarios, then, when

from server.app.game import GameManager

scenarios("../features/saldo.feature")


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

    # Ensure battle started
    if game.state.phase != "battle":
        game._start_battle()

    # Ensure it's player A's turn
    game.state.turn_player_id = player_a

    ctx["game"] = game
    ctx["player_a"] = player_a
    ctx["player_b"] = player_b
    ctx["message"] = None
    return ctx


@given("player A has saldo 1")
def set_saldo_1(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    game.state.players[player_a].saldo = 1


@given("player A has saldo 3")
def set_saldo_3(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    game.state.players[player_a].saldo = 3


@given("player A has saldo 0")
def set_saldo_0(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    game.state.players[player_a].saldo = 0


@given("player A has saldo 2")
def set_saldo_2(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    game.state.players[player_a].saldo = 2


@given("player B has no bases")
def player_b_no_bases(battle_game):
    game = battle_game["game"]
    player_b = battle_game["player_b"]
    game.state.bases[player_b] = set()


@when("player A performs a precise shot")
def precise_shot(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    message, _ = game.shot(player_a, "precise")
    battle_game["message"] = message


@when("player A performs a strong shot")
def strong_shot(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    message, _ = game.shot(player_a, "strong")
    battle_game["message"] = message


@when("player A buys a base at position 2 4")
def buy_base(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    message = game.buy_base(player_a, (2, 4))
    battle_game["message"] = message


@then("player A saldo should be 0")
def saldo_should_be_zero(battle_game):
    game = battle_game["game"]
    player_a = battle_game["player_a"]
    assert game.state.players[player_a].saldo == 0


@then('the action should be rejected with "Saldo insuficiente"')
def action_rejected(battle_game):
    assert battle_game["message"] == "Saldo insuficiente"
