Feature: Victory
  As a player
  I want the game to end when all enemy bases are destroyed
  So that a winner is declared

  Scenario: Player A wins by destroying the last enemy base
    Given a battle game with two players
    And player B has a single base at position 0 0
    And player A normal shot is fixed to position 0 0
    When player A performs a normal shot
    Then the game phase should be "ended"
    And the winner should be player A
