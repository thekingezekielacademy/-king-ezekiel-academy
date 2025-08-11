// Supabase Edge Function: fetch_youtube_playlist
// Debug version to identify the 400 error

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    console.log("🎬 YouTube Playlist Fetcher Started");
    
    // Parse the request
    let playlistId = "";
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      playlistId = body?.playlistId || "";
    } else {
      const url = new URL(req.url);
      playlistId = url.searchParams.get("playlistId") || "";
    }

    console.log("📺 Fetching playlist:", playlistId);

    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    // Get YouTube API key from environment
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      throw new Error("YouTube API key not configured");
    }

    console.log("🔑 API Key available, proceeding with YouTube API calls...");
    console.log("🔑 API Key (first 10 chars):", apiKey.substring(0, 10) + "...");

    try {
      // Step 1: Get playlist items
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
      
      console.log("🔗 Playlist URL (without key):", `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=[HIDDEN]`);
      console.log("🔗 Fetching playlist items from YouTube API...");
      
      const playlistResponse = await fetch(playlistUrl);
      
      console.log("📊 Playlist response status:", playlistResponse.status);
      console.log("📊 Playlist response statusText:", playlistResponse.statusText);
      console.log("📊 Playlist response headers:", Object.fromEntries(playlistResponse.headers.entries()));
      
      if (!playlistResponse.ok) {
        const errorText = await playlistResponse.text();
        console.error("❌ YouTube API error response:", errorText);
        throw new Error(`YouTube API error: ${playlistResponse.status} ${playlistResponse.statusText} - ${errorText}`);
      }

      const playlistData = await playlistResponse.json();
      console.log("📊 Playlist API response structure:", Object.keys(playlistData));
      console.log("📊 Playlist API response items count:", playlistData.items?.length || 0);
      
      if (playlistData.error) {
        console.error("❌ YouTube API returned error:", playlistData.error);
        throw new Error(`YouTube API error: ${playlistData.error.message || 'Unknown API error'}`);
      }

      if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error("No videos found in this playlist");
      }

      console.log(`✅ Found ${playlistData.items.length} videos in playlist`);
      console.log("📺 First video snippet:", playlistData.items[0]?.snippet);

      // Step 2: Get video details (including duration) for each video
      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
      
      console.log("🎥 Video IDs extracted:", videoIds);
      console.log("🎥 Videos URL (without key):", `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=[HIDDEN]`);
      console.log("🎥 Fetching video details...");
      
      const videosResponse = await fetch(videosUrl);
      
      console.log("📊 Videos response status:", videosResponse.status);
      console.log("📊 Videos response statusText:", videosResponse.statusText);
      
      if (!videosResponse.ok) {
        const errorText = await videosResponse.text();
        console.error("❌ YouTube Videos API error response:", errorText);
        throw new Error(`YouTube Videos API error: ${videosResponse.status} ${videosResponse.statusText} - ${errorText}`);
      }

      const videosData = await videosResponse.json();
      console.log("📊 Videos API response structure:", Object.keys(videosData));
      console.log("📊 Videos API response items count:", videosData.items?.length || 0);
      
      if (videosData.error) {
        console.error("❌ YouTube Videos API returned error:", videosData.error);
        throw new Error(`YouTube Videos API error: ${videosData.error.message || 'Unknown API error'}`);
      }

      console.log(`✅ Fetched details for ${videosData.items?.length || 0} videos`);

      // Step 3: Combine playlist and video data
      const enrichedItems = playlistData.items.map((playlistItem: any, index: number) => {
        const videoId = playlistItem.snippet.resourceId.videoId;
        const videoData = videosData.items.find((v: any) => v.id === videoId);
        
        const enrichedItem = {
          videoId: videoId,
          title: playlistItem.snippet.title,
          description: playlistItem.snippet.description || `Video ${index + 1} from playlist`,
          thumbnailUrl: playlistItem.snippet.thumbnails?.medium?.url || playlistItem.snippet.thumbnails?.default?.url || null,
          duration: videoData?.contentDetails?.duration || 'PT0S',
          publishedAt: playlistItem.snippet.publishedAt,
          channelTitle: playlistItem.snippet.channelTitle
        };
        
        console.log(`🎬 Enriched item ${index}:`, enrichedItem);
        return enrichedItem;
      });

      console.log("🎉 Successfully processed real YouTube playlist data");
      console.log("📊 Final enriched items count:", enrichedItems.length);

      return new Response(JSON.stringify({
        items: enrichedItems,
        playlistInfo: {
          id: playlistId,
          title: playlistData.items[0]?.snippet?.channelTitle || 'YouTube Playlist',
          videoCount: enrichedItems.length
        }
      }), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "content-type": "application/json",
        },
        status: 200,
      });

    } catch (youtubeError) {
      console.error("❌ YouTube API error:", youtubeError);
      console.error("❌ Error message:", youtubeError.message);
      console.error("❌ Error stack:", youtubeError.stack);
      console.log("🔄 Falling back to test data due to YouTube API error");
      
      // Fallback to test data if YouTube API fails
      const testData = {
        items: [
          {
            videoId: "test123",
            title: "Test Video - YouTube API Failed",
            description: `YouTube API error: ${youtubeError.message}`,
            thumbnailUrl: null,
            duration: "PT5M30S",
            publishedAt: new Date().toISOString(),
            channelTitle: "Test Channel"
          }
        ],
        playlistInfo: {
          id: playlistId,
          title: "Test Playlist (API Failed)",
          videoCount: 1
        }
      };

      return new Response(JSON.stringify(testData), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "content-type": "application/json",
        },
        status: 200,
      });
    }

  } catch (e) {
    console.error("❌ Edge Function error:", e);
    
    return new Response(JSON.stringify({ 
      error: e.message || "Unknown error",
      details: e.toString()
    }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "content-type": "application/json",
      },
      status: 400,
    });
  }
});


