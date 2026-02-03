Feature: Placement
  As a player
  I want to place bases before battle
  So that the game starts correctly

  Scenario: Battle starts after both players place 5 bases
    Given a placement game with two players
    When player A places 5 bases
    And player B places 5 bases
    Then the game phase should be "battle"
