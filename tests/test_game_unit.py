from server.app.game import GameManager


def test_add_ai_player_creates_player():
    game = GameManager()
    ai_id = game.add_ai_player("CPU")
    assert ai_id in game.state.players
    assert game.state.players[ai_id].name == "CPU"
