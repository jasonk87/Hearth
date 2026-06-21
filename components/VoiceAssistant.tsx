
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, Session, LiveServerMessage, GenerateContentResponse } from '@google/genai';
import { 
    ai, createBlob, 
    launchAppFunctionDeclaration,
    addGroceryItemFunctionDeclaration,
    completeGroceryItemFunctionDeclaration, clearCompletedGroceriesFunctionDeclaration,
    addCalendarEventFunctionDeclaration,
    editCalendarEventFunctionDeclaration, deleteCalendarEventFunctionDeclaration,
    addNoteFunctionDeclaration, deleteNoteFunctionDeclaration,
    setDinnerPlanFunctionDeclaration,
    startStoryFunctionDeclaration,
} from '../services/geminiService';
import { MicIcon } from './icons';
import type { CalendarEvent, GroceryItem, CalendarSource, Note } from '../types';
import type { ModalType } from '../App';
import { useToast } from './Toast';

interface VoiceAssistantProps {
  notes: Note[];
  onAddNote: (text: string) => void;
  onDeleteNote: (id: number) => void;
  eventsBySource: Record<CalendarSource, Record<string, CalendarEvent[]>>;
  onAddCalendarEvent: (title: string, date: string, time: string) => void;
  onDeleteCalendarEvent: (eventId: number | string) => void;
  onEditCalendarEvent: (event: CalendarEvent) => void;
  groceryList: GroceryItem[];
  onAddGroceryItem: (name: string, section: string) => void;
  onToggleGroceryItem: (id: number) => void;
  onClearCompletedGroceries: () => void;
  setActiveModal: (modal: ModalType | null) => void;
  onSetDinnerForDay: (dateKey: string, dinner: string) => void;
  onGeneralQuery: (userQuery: string, modelResponse: string) => void;
  onStartStory: (prompt: string) => Promise<void>;
}

const dayNameToIndex = (dayName: string): number => {
    const lowerDayName = dayName.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (lowerDayName === 'today') return 0;
    if (lowerDayName === 'tomorrow') return 1;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(lowerDayName);
    if (targetDayIndex === -1) return -1;

    const todayDayIndex = today.getDay();
    const diff = targetDayIndex - todayDayIndex;
    return diff >= 0 ? diff : diff + 7;
};

const findEventByDetails = (eventsBySource: Record<CalendarSource, Record<string, CalendarEvent[]>>, dayIndex: number | string, title: string, time?: string): CalendarEvent | null => {
    let dayKey: string;
    
    if (typeof dayIndex === 'string') {
        dayKey = dayIndex;
    } else {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayIndex);
        dayKey = targetDate.toISOString().split('T')[0];
    }

    const lowerTitle = title.toLowerCase();

    for (const source of Object.keys(eventsBySource) as CalendarSource[]) {
        const dayEvents = eventsBySource[source][dayKey];
        if (dayEvents) {
            const foundEvent = dayEvents.find(event => {
                const eventTitle = event.title.toLowerCase();
                const titleMatch = eventTitle.includes(lowerTitle) || lowerTitle.includes(eventTitle);
                const timeMatch = !time || event.time === time;
                return titleMatch && timeMatch;
            });
            if (foundEvent) return foundEvent;
        }
    }
    return null;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = (props) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const { showToast } = useToast();
  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Refs for transcription handling
  const userInputRef = useRef('');
  const toolCallMadeInTurn = useRef(false);
  const processedToolCallIds = useRef(new Set<string>());


  const stopListening = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) { console.error("Error closing session:", e); }
        sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
        audioContextRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  const handleToolCall = useCallback(async (functionName: string, args: any): Promise<string> => {
    console.log("Tool call:", functionName, args);
    let message = '';
    let messageType: 'success' | 'error' = 'success';
    
    switch (functionName) {
        case 'launchApp': {
            const appName = args.appName.toLowerCase();
            if (['calendar', 'games', 'notes', 'grocery', 'storyboard'].includes(appName)) {
                props.setActiveModal(appName as ModalType);
                message = `Opening the ${appName} app.`;
            } else {
                message = `Sorry, I can't find an app named ${appName}.`;
                messageType = 'error';
            }
            break;
        }
        case 'startStory': {
            props.setActiveModal('storyboard');
            await props.onStartStory(args.prompt);
            message = `Okay, let's create a story about ${args.prompt}!`;
            break;
        }
        case 'setDinnerPlan': {
            let dateKey = args.date;
            if (!dateKey) {
                const dayIndex = dayNameToIndex(args.day);
                if (dayIndex >= 0) {
                    const today = new Date();
                    const targetDate = new Date(today);
                    targetDate.setDate(today.getDate() + dayIndex);
                    dateKey = targetDate.toISOString().split('T')[0];
                }
            }

            if (dateKey) {
                props.onSetDinnerForDay(dateKey, args.mealName);
                message = `OK, I've set ${args.mealName} for dinner.`;
            } else {
                message = `Sorry, I couldn't understand which day you meant.`;
                messageType = 'error';
            }
            break;
        }
        case 'addNote': {
            props.onAddNote(args.noteText);
            message = `Added new note.`;
            break;
        }
        case 'deleteNote': {
            const noteTextToFind = args.noteText.toLowerCase();
            const noteToDelete = props.notes.find(n => n.text.toLowerCase().includes(noteTextToFind));
            if (noteToDelete) {
                props.onDeleteNote(noteToDelete.id);
                message = `Deleted note about "${args.noteText}".`;
            } else {
                message = `I couldn't find a note matching "${args.noteText}".`;
                messageType = 'error';
            }
            break;
        }
        case 'addGroceryItem': {
            const { itemName } = args;
            try {
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: `Categorize the grocery item "${itemName}" into one of these exact categories: Produce, Dairy, Meat, Bakery, Pantry, Frozen, Drinks, Household, Other.`,
                    config: {
                        thinkingConfig: {
                            thinkingBudget: 24576,
                        }
                    }
                });
                const section = response.text.trim();
                props.onAddGroceryItem(itemName, section);
                message = `Added ${itemName} to your list.`;
            } catch (e) {
                console.error("Error categorizing item:", e);
                props.onAddGroceryItem(itemName, 'Other');
                message = `Added ${itemName}, but couldn't categorize it.`;
            }
            break;
        }
        case 'completeGroceryItem': {
            const itemName = args.itemName.toLowerCase();
            const itemToComplete = props.groceryList.find(item => item.name.toLowerCase().includes(itemName) && !item.completed);
            if (itemToComplete) {
                props.onToggleGroceryItem(itemToComplete.id);
                message = `Checked off ${itemToComplete.name}.`;
            } else {
                message = `I couldn't find "${args.itemName}" on your list.`;
                messageType = 'error';
            }
            break;
        }
        case 'clearCompletedGroceries': {
            props.onClearCompletedGroceries();
            message = `Cleared the completed items from your list.`;
            break;
        }
        case 'addCalendarEvent': {
            let dateKey = args.date;
            if (!dateKey) {
                const dayIndex = dayNameToIndex(args.day);
                if (dayIndex >= 0 && dayIndex < 7) {
                    const today = new Date();
                    const targetDate = new Date(today);
                    targetDate.setDate(today.getDate() + dayIndex);
                    dateKey = targetDate.toISOString().split('T')[0];
                }
            }

            if (dateKey) {
                props.onAddCalendarEvent(args.title, dateKey, args.time);
                message = `Added "${args.title}".`;
            } else {
                message = `Sorry, I couldn't add that event. Please specify a valid day.`;
                messageType = 'error';
            }
            break;
        }
        case 'deleteCalendarEvent': {
            let searchKey: string | number = args.date;
            if (!searchKey) {
                const dayIndex = dayNameToIndex(args.day);
                if (dayIndex >= 0) {
                    searchKey = dayIndex;
                }
            }

            if (searchKey === undefined) {
                 message = `Sorry, I couldn't understand which day you meant.`;
                 messageType = 'error';
                 break;
            }
            const eventToDelete = findEventByDetails(props.eventsBySource, searchKey, args.title, args.time);
            if(eventToDelete) {
                props.onDeleteCalendarEvent(eventToDelete.id);
                message = `Removed "${eventToDelete.title}" from the calendar.`;
            } else {
                message = `Sorry, I couldn't find "${args.title}".`;
                messageType = 'error';
            }
            break;
        }
        case 'editCalendarEvent': {
            let searchKey: string | number = args.date;
            if (!searchKey) {
                const dayIndex = dayNameToIndex(args.day);
                if (dayIndex >= 0) {
                    searchKey = dayIndex;
                }
            }

            if (searchKey === undefined) {
                message = `Sorry, I couldn't understand which day you meant.`;
                messageType = 'error';
                break;
            }

            const eventToEdit = findEventByDetails(props.eventsBySource, searchKey, args.originalTitle);
            if (!eventToEdit) {
                message = `I couldn't find "${args.originalTitle}".`;
                messageType = 'error';
                break;
            }
            
            const updatedEvent = { ...eventToEdit };
            const updates = [];

            if (args.newTitle) { updatedEvent.title = args.newTitle; updates.push('title'); }
            if (args.newTime) { updatedEvent.time = args.newTime; updates.push('time'); }
            if (args.participantToAdd) {
                updatedEvent.participants = [...(updatedEvent.participants || []), args.participantToAdd];
                updates.push('participants');
            }
            
            if(updates.length > 0) {
                props.onEditCalendarEvent(updatedEvent);
                message = `Updated ${updates.join(', ')} for "${args.originalTitle}".`;
            } else {
                message = `No changes specified for the event.`;
                messageType = 'error';
            }
            break;
        }
        default:
            message = "I'm sorry, I can't do that.";
            messageType = 'error';
            break;
    }

    if (message) {
        showToast(message, messageType);
    }
    return message || 'OK';
  }, [props, showToast]);

  const startListening = useCallback(async () => {
    isListeningRef.current = true;
    setIsListening(true);

    const handleAskAi = async (query: string) => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: query,
                config: {
                    thinkingConfig: {
                        thinkingBudget: 24576,
                    }
                }
            });
            props.onGeneralQuery(query, response.text);
        } catch (e) {
            console.error("Error in general query:", e);
            showToast("Sorry, I couldn't answer that question.", 'error');
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!isListeningRef.current) {
            // User cancelled before media device stream could initialize
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        mediaStreamRef.current = stream;
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        const allTools = [
            launchAppFunctionDeclaration,
            addNoteFunctionDeclaration,
            deleteNoteFunctionDeclaration,
            addGroceryItemFunctionDeclaration,
            completeGroceryItemFunctionDeclaration,
            clearCompletedGroceriesFunctionDeclaration, addCalendarEventFunctionDeclaration,
            editCalendarEventFunctionDeclaration, deleteCalendarEventFunctionDeclaration,
            setDinnerPlanFunctionDeclaration,
            startStoryFunctionDeclaration,
        ];

        const systemInstruction = `You are a helpful kitchen assistant for a family. All actions should be for the shared family context. If a function is called, provide only the tool response, no additional conversational text. If no function is called, provide a conversational text response.`;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: allTools }],
                inputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    userInputRef.current = '';
                    toolCallMadeInTurn.current = false;
                    processedToolCallIds.current.clear();

                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;
                    const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                           session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        userInputRef.current += message.serverContent.inputTranscription.text;
                    }
                    
                    if (message.toolCall?.functionCalls) {
                        toolCallMadeInTurn.current = true;
                        const session = await sessionPromiseRef.current;
                        if (!session) return;

                        // Process tool calls sequentially to ensure proper awaiting
                        for (const fc of message.toolCall.functionCalls) {
                           if (!processedToolCallIds.current.has(fc.id)) {
                               processedToolCallIds.current.add(fc.id);
                               const result = await handleToolCall(fc.name, fc.args);
                               session.sendToolResponse({
                                    functionResponses: {
                                        id : fc.id,
                                        name: fc.name,
                                        response: { result: result },
                                    }
                               });
                           }
                        }
                    }
                    
                    if (message.serverContent?.turnComplete) {
                        // Capture the current input before it gets reset or overwritten
                        const finalInput = userInputRef.current;
                        if (!toolCallMadeInTurn.current && finalInput) {
                            handleAskAi(finalInput);
                        }
                        stopListening();
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Gemini Live API Error:', e);
                    showToast('Voice assistant error.', 'error');
                    stopListening();
                },
                onclose: () => {},
            },
        });
    } catch (error) {
        console.error('Error starting voice assistant:', error);
        showToast('Could not start microphone.', 'error');
        isListeningRef.current = false;
        setIsListening(false);
    }
  }, [stopListening, handleToolCall, showToast, props.onGeneralQuery]);

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <>
      <button
        onClick={toggleListening}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-teal-600 hover:bg-teal-500'}`}
        aria-label="Toggle Voice Assistant"
      >
        <MicIcon className="w-8 h-8 sm:w-10 sm:h-10" />
      </button>

      {isListening && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 flex items-center justify-center p-4" onClick={stopListening}>
           <div className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl w-full max-w-lg flex flex-col items-center gap-4 border border-slate-200/80">
                <h3 className="text-2xl font-bold text-teal-600">Listening...</h3>
                <MicIcon className="w-16 h-16 text-teal-500 animate-pulse" />
                <p className="text-slate-600">Tap anywhere to stop.</p>
           </div>
        </div>
      )}
    </>
  );
};