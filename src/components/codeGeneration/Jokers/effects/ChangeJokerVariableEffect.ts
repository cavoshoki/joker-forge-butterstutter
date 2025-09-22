import type { Effect } from "../../../ruleBuilder/types";
import type { EffectReturn } from "../effectUtils";

export const generateChangeJokerVariableReturn = (
  effect: Effect,
  triggerType: string,
): EffectReturn => {
  const variableName = (effect.params.variable_name as string) || "jokerVar";
  const jokerKeyValue = (effect.params.joker_key as string) || "joker";
  const jokerIndex = (effect.params.joker_index as number) || 1;
  const jokerPosition = (effect.params.joker_position as string) || "random";
  const changeMethod = (effect.params.joker_context as string) || "random";
  
  const scoringTriggers = ["hand_played", "card_scored"];
  const isScoring = scoringTriggers.includes(triggerType);

  let statement = ``

  if (changeMethod === "random") {
    statement += `
    local all_jokers, pool_key = get_current_pool('joker')
    card.ability.extra.${variableName} = pseudorandom_element(all_jokers, pseudoseed(pool_key))`
  } 
  else if (changeMethod !== "specific") {

    if (jokerPosition !== "left" && jokerPosition !== "right" && 
        jokerPosition !== "random" && changeMethod !== "index") {
      statement += `
          local my_pos = nil
          for i = 1, #G.jokers.cards do
              if G.jokers.cards[i] == card then
                  my_pos = i
                  break
              end
          end`
    }
    
    if (changeMethod === "index") {
      statement += `    
        local target_index = ${jokerIndex}`
    } else if (changeMethod === "evaled_joker") {
      statement += `
        local target_index = 1
        for i, v in ipairs(G.jokers.cards) do
            if v == context.other_joker then
                target_index = i
            end
        end`
    } else if (jokerPosition === "left") {
      statement += `
        local target_index = my_pos - 1`
    } else if (jokerPosition === "right") {
        statement += `
        local target_index = my_pos + 1`
    } else if (jokerPosition === "first") {
        statement += `
        local target_index = 1`
    } else if (jokerPosition === "last") {
        statement += `
        local target_index = #G.jokers.cards`
    } else if (jokerPosition === "random") {
        statement += `
        local target_index = pseudorandom(pseudoseed('index_joker'),1,#G.jokers.cards)`
    } 

    statement +=  `
        local chosen_joker = G.jokers.cards[target_index].key
        if chosen_joker then
              G.GAME.current_round.${variableName} = chosen_joker
        end`

  } else if (changeMethod === "specific") {
    statement += `
              G.GAME.current_round.${variableName} = "j_${jokerKeyValue}"`
  }

  const result: EffectReturn = {
    statement,
    colour: "G.C.FILTER",
  };

  if (effect.customMessage) {
    result.message = effect.customMessage;
  }
  const customMessage = effect.customMessage;
  const messageColor = "G.C.WHITE";

  if (isScoring){
    return {
      statement: `
      __PRE_RETURN_CODE__ 
      ${statement}
      __PRE_RETURN_CODE_END__`,
      message: customMessage || undefined,
      colour: messageColor
    }
  } else {
      return {
        statement: `
      func = function()
          ${statement}
          return true
      end`,
      message: customMessage || undefined,
      colour: messageColor
      }
    }
};
