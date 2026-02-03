Feature: Lobby ready
  As a player
  I want the lobby to start placement when both are ready
  So that the match can begin

  Scenario: Both players ready starts placement
    Given a lobby game with two players
    When player A marks ready
    And player B marks ready
    Then the game phase should be "placement"
