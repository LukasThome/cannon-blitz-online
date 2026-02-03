Feature: Saldo
  As a player
  I want saldo to be spent and earned correctly
  So that the game economy is fair

  Scenario: Precise shot costs 1 saldo
    Given a battle game with two players
    And player A has saldo 1
    And player B has no bases
    When player A performs a precise shot
    Then player A saldo should be 0

  Scenario: Strong shot costs 3 saldo
    Given a battle game with two players
    And player A has saldo 3
    And player B has no bases
    When player A performs a strong shot
    Then player A saldo should be 0

  Scenario: Precise shot rejected with insufficient saldo
    Given a battle game with two players
    And player A has saldo 0
    When player A performs a precise shot
    Then the action should be rejected with "Saldo insuficiente"

  Scenario: Strong shot rejected with insufficient saldo
    Given a battle game with two players
    And player A has saldo 2
    When player A performs a strong shot
    Then the action should be rejected with "Saldo insuficiente"

  Scenario: Buying base costs 2 saldo
    Given a battle game with two players
    And player A has saldo 2
    When player A buys a base at position 2 4
    Then player A saldo should be 0
