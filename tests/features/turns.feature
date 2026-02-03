Feature: Turn logic
  As a player
  I want turns enforced
  So that only the current player can act

  Scenario: Shot rejected when not your turn
    Given a battle game with two players
    And it is player B's turn
    When player A performs a normal shot
    Then the action should be rejected with "Nao e seu turno"
