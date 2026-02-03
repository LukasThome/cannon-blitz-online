Feature: Reconnect
  As a player
  I want to reconnect after a disconnect
  So that I can continue the match

  Scenario: Player disconnects and reconnects
    Given a battle game with two players
    When player A disconnects
    Then player A should be offline
    When player A reconnects
    Then player A should be online
